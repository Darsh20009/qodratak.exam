import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Crown, Award, Zap, Star, Brain, Flame, Shield, BarChart3, Target, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import confetti from "canvas-confetti";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const GREEN = "#1a7c3e";
const GREEN_LIGHT = "#e8f5ee";
const GREEN_BORDER = "#bbf7d0";

export default function LeaderboardPage() {
  const { user } = useUser();
  const [showCelebration, setShowCelebration] = useState(false);

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery<{
    top10: any[];
    userContext: any[];
    userRank: any;
  }>({ queryKey: ['/api/leaderboard'] });

  const top10 = leaderboardData?.top10 || [];
  const userContext = leaderboardData?.userContext || [];

  const { data: userRank, isLoading: rankLoading } = useQuery<any>({
    queryKey: [`/api/users/${user?.id}/rank`],
    enabled: !!user?.id
  });

  const { data: monthlyWinners, isLoading: winnersLoading } = useQuery<any[]>({
    queryKey: ['/api/monthly-winners'],
  });

  const { data: userBadges } = useQuery<any[]>({
    queryKey: ['/api/users', user?.id, 'badges'],
    enabled: !!user?.id
  });

  const { data: pointsHistory, isLoading: pointsLoading } = useQuery<any>({
    queryKey: [`/api/points-history/${user?.id}`],
    enabled: !!user?.id
  });

  useEffect(() => {
    if (userRank && userRank.currentRank <= 10 && !showCelebration) {
      triggerConfetti();
      setShowCelebration(true);
    }
  }, [userRank]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const interval = setInterval(() => {
      if (Date.now() > animationEnd) return clearInterval(interval);
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#FFD700', '#1a7c3e', '#22a85a'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FFD700', '#1a7c3e', '#22a85a'] });
    }, 250);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getRankChangeIcon = (change: string) => {
    if (change === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change === "down") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getPrizeBg = (rank: number) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', border: '#fbbf24' };
    if (rank === 2) return { bg: 'linear-gradient(135deg, #9ca3af, #6b7280)', border: '#d1d5db' };
    return { bg: 'linear-gradient(135deg, #d97706, #b45309)', border: '#f59e0b' };
  };

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case "first_test": return <Shield className="h-4 w-4" />;
      case "golden_mind": return <Brain className="h-4 w-4" />;
      case "speed_challenge": return <Zap className="h-4 w-4" />;
      case "weekly_top": return <Star className="h-4 w-4" />;
      case "monthly_top": return <Trophy className="h-4 w-4" />;
      default: return <Flame className="h-4 w-4" />;
    }
  };

  const getTestTypeLabel = (t: string) => ({ verbal: 'لفظي', quantitative: 'كمي', mixed: 'مختلط', qiyas: 'قياس', custom: 'مخصص' }[t] || t);
  const getDifficultyLabel = (d: string) => ({ beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' }[d] || d);

  const getPointsColor = (pts: number) => pts >= 100 ? 'text-green-600' : pts >= 50 ? 'text-blue-600' : pts >= 0 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="px-3 py-4 sm:px-6 sm:py-6 bg-gray-50 min-h-screen pb-24" data-testid="leaderboard-page">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: GREEN_LIGHT }}>
              <Trophy className="h-7 w-7" style={{ color: GREEN }} />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">لوحة المتفوقين</h1>
          <p className="text-gray-500 text-base">تنافس مع آلاف الطلاب واحصل على مركزك بين الأفضل</p>
        </div>

        {/* Monthly Winners */}
        {!winnersLoading && monthlyWinners && monthlyWinners.length > 0 && (
          <Card className="border-2 border-amber-200 bg-amber-50" data-testid="monthly-winners-section">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl text-amber-800">
                <Trophy className="h-5 w-5 text-amber-500" />
                الفائزون بالشهر الحالي 🏆
              </CardTitle>
              <p className="text-sm text-amber-600">المراكز الثلاثة الأولى مع الجوائز المالية</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {monthlyWinners.map((winner) => {
                  const prize = getPrizeBg(winner.rank);
                  return (
                    <div
                      key={winner.id}
                      className={cn("relative p-6 rounded-2xl text-white shadow-lg", winner.rank === 1 && "md:-mt-2 ring-2 ring-yellow-300")}
                      style={{ background: prize.bg, border: `2px solid ${prize.border}` }}
                      data-testid={`winner-${winner.rank}`}
                    >
                      <div className="absolute top-3 right-3">{getRankIcon(winner.rank)}</div>
                      <div className="text-center space-y-2">
                        <div className="text-2xl font-black">المركز {winner.rank}</div>
                        <div className="text-lg font-bold opacity-90">{winner.displayName}</div>
                        <div className="text-4xl font-black drop-shadow">{winner.prize} ريال</div>
                        <div className="text-sm bg-black/20 rounded-full px-3 py-1 inline-block">{winner.totalPoints} نقطة</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Stats */}
        {user && userRank && (
          <Card className="border-2 shadow-sm" style={{ borderColor: GREEN_BORDER, background: GREEN_LIGHT }} data-testid="user-stats-card">
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-600 mb-1">ترتيبك الحالي</div>
                  <div className="text-3xl font-black text-gray-900">{userRank.currentRank ? `#${userRank.currentRank}` : "—"}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">{userRank.currentRank && getRankChangeIcon(userRank.rankChange || "stable")}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">إجمالي النقاط</div>
                  <div className="text-3xl font-black" style={{ color: GREEN }}>{userRank.totalPoints || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">عدد الاختبارات</div>
                  <div className="text-3xl font-black text-gray-900">{userRank.totalTests || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">الحالة</div>
                  <div className="text-xl font-black text-gray-900 mt-1">
                    {!userRank.currentRank ? "🚀 ابدأ الآن" : userRank.rankChange === "up" ? "🔺 صاعد" : userRank.rankChange === "down" ? "🔻 متراجع" : "⚫ ثابت"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Badges */}
        {userBadges && userBadges.length > 0 && (
          <Card data-testid="user-badges-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <Zap className="h-5 w-5 text-amber-500" />
                شاراتك المكتسبة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {userBadges.map((badge) => (
                  <div key={badge.id} className="group relative" data-testid={`badge-${badge.id}`}>
                    <Badge
                      className="px-4 py-2 text-sm font-bold cursor-pointer flex items-center gap-2"
                      style={{ backgroundColor: badge.color, color: 'white', boxShadow: `0 2px 8px ${badge.color}40` }}
                    >
                      {getBadgeIcon(badge.type)}
                      {badge.nameAr}
                    </Badge>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {badge.description}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Points History */}
        {user && pointsHistory && !pointsLoading && (
          <Card data-testid="points-history-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <BarChart3 className="h-5 w-5" style={{ color: GREEN }} />
                سجل النقاط التفصيلي
              </CardTitle>
              <p className="text-sm text-gray-500">تتبع تفصيلي لجميع نقاطك من الاختبارات</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Target, label: 'إجمالي الاختبارات', value: pointsHistory.statistics.totalTests, color: GREEN, bg: GREEN_LIGHT },
                  { icon: Trophy, label: 'متوسط النقاط', value: pointsHistory.statistics.averagePoints, color: '#d97706', bg: '#fffbeb' },
                  { icon: Star, label: 'أعلى نتيجة', value: pointsHistory.statistics.highestPoints, color: '#0369a1', bg: '#eff6ff' },
                  { icon: CheckCircle, label: 'اختبار ناجح', value: pointsHistory.statistics.positiveTestsCount, color: '#16a34a', bg: '#f0fdf4' },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                  <div key={label} className="rounded-xl border p-4 text-center" style={{ background: bg, borderColor: `${color}30` }}>
                    <Icon className="h-5 w-5 mx-auto mb-2" style={{ color }} />
                    <div className="text-2xl font-black" style={{ color }}>{value}</div>
                    <div className="text-xs text-gray-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* Top Performances */}
              {pointsHistory.topPerformances?.length > 0 && (
                <div>
                  <h3 className="font-bold text-base text-gray-800 mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />أفضل 5 أداءات
                  </h3>
                  <div className="space-y-2">
                    {pointsHistory.topPerformances.map((test: any, index: number) => (
                      <div key={test.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-amber-500 w-6 text-center">{index + 1}</span>
                          <div>
                            <div className="font-semibold text-gray-800 text-sm">اختبار {getTestTypeLabel(test.testType)}</div>
                            <div className="text-xs text-gray-500">{getDifficultyLabel(test.difficulty)} • {test.score}/{test.totalQuestions} ({test.percentage.toFixed(0)}%)</div>
                            <div className="text-xs text-gray-400">{format(new Date(test.completedAt), 'dd MMM yyyy', { locale: ar })}</div>
                          </div>
                        </div>
                        <div className={cn("text-xl font-black", getPointsColor(test.points))}>
                          {test.points > 0 ? '+' : ''}{test.points}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Points by Type */}
              {pointsHistory.pointsByType && Object.keys(pointsHistory.pointsByType).length > 0 && (
                <div>
                  <h3 className="font-bold text-base text-gray-800 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-500" />النقاط حسب نوع الاختبار
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(pointsHistory.pointsByType).map(([type, data]: [string, any]) => (
                      <div key={type} className="p-4 rounded-xl border border-gray-200 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-gray-800">{getTestTypeLabel(type)}</span>
                          <Badge variant="secondary">{data.count} اختبار</Badge>
                        </div>
                        <div className="text-xl font-black" style={{ color: GREEN }}>{data.total} نقطة</div>
                        <div className="text-xs text-gray-400 mt-1">متوسط: {(data.total / data.count).toFixed(1)} نقطة/اختبار</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Tests */}
              {pointsHistory.recentTests?.length > 0 && (
                <div>
                  <h3 className="font-bold text-base text-gray-800 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />الاختبارات الأخيرة
                  </h3>
                  <div className="space-y-2">
                    {pointsHistory.recentTests.map((test: any) => (
                      <div key={test.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-gray-800 text-sm">{getTestTypeLabel(test.testType)}</span>
                            <Badge variant="outline" className="text-xs">{getDifficultyLabel(test.difficulty)}</Badge>
                          </div>
                          <div className="text-xs text-gray-400">{test.score}/{test.totalQuestions} ({test.percentage.toFixed(0)}%) • {format(new Date(test.completedAt), 'dd/MM/yyyy HH:mm', { locale: ar })}</div>
                        </div>
                        <div className={cn("text-lg font-black mr-3", getPointsColor(test.points))}>
                          {test.points > 0 ? '+' : ''}{test.points}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Table */}
        <Card data-testid="leaderboard-table">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
              <Trophy className="h-5 w-5 text-amber-500" />
              التصنيف العام
            </CardTitle>
            <p className="text-sm text-gray-500">ترتيب أفضل 100 طالب بناءً على النقاط المكتسبة</p>
          </CardHeader>
          <CardContent>
            {leaderboardLoading || rankLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-r-transparent" style={{ borderColor: GREEN, borderRightColor: 'transparent' }}></div>
                <p className="text-gray-500 mt-4">جاري تحميل البيانات...</p>
              </div>
            ) : top10 && top10.length > 0 ? (
              <div className="space-y-5">
                {/* Top 10 */}
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-gray-600 mb-3">🏆 أفضل 10 طلاب</h3>
                  {top10.map((entry, index) => {
                    const isMe = entry.userId === user?.id;
                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all",
                          isMe
                            ? "border-2"
                            : index < 3
                            ? "bg-amber-50 border-amber-200"
                            : "bg-white border-gray-100 hover:bg-gray-50"
                        )}
                        style={isMe ? { borderColor: GREEN, background: GREEN_LIGHT } : {}}
                        data-testid={`leaderboard-entry-${entry.userId}`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 w-14">
                            {getRankIcon(entry.currentRank)}
                            <span className="text-lg font-black text-gray-700">{entry.currentRank}</span>
                          </div>
                          <div>
                            <div className={cn("font-bold text-sm sm:text-base", isMe ? "text-gray-900" : "text-gray-800")}>
                              {entry.username}{isMe && <span className="text-xs mr-1 text-gray-500">(أنت)</span>}
                            </div>
                            <div className="text-xs text-gray-400">{entry.totalTests} اختبار</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-black" style={{ color: isMe ? GREEN : '#d97706' }}>{entry.totalPoints}</div>
                            <div className="text-xs text-gray-400">نقطة</div>
                          </div>
                          <div>{getRankChangeIcon(entry.rankChange)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* User Context */}
                {user && userRank && !top10.find(e => e.userId === user?.id) && (
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <h3 className="font-bold text-sm text-gray-600 mb-3">📍 ترتيبك الحالي</h3>
                    <div
                      className="flex items-center justify-between p-4 rounded-xl border-2"
                      style={{ borderColor: GREEN, background: GREEN_LIGHT }}
                      data-testid={`user-rank-card-${user.id}`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 w-14">
                          <Crown className="h-4 w-4" style={{ color: GREEN }} />
                          <span className="text-lg font-black text-gray-700">{userRank.currentRank || "—"}</span>
                        </div>
                        <div>
                          <div className="font-bold text-sm sm:text-base text-gray-900">{user.username || user.name} <span className="text-xs text-gray-500">(أنت)</span></div>
                          <div className="text-xs text-gray-500">{userRank.totalTests || 0} اختبار</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-black" style={{ color: GREEN }}>{userRank.totalPoints || 0}</div>
                          <div className="text-xs text-gray-400">نقطة</div>
                        </div>
                        <div>{getRankChangeIcon(userRank.rankChange || "stable")}</div>
                      </div>
                    </div>
                    {/* Context neighbors */}
                    {userContext?.filter(e => e.userId !== user?.id).map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors"
                        data-testid={`user-context-entry-${entry.userId}`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 w-14">
                            <span className="text-lg font-black text-gray-500">{entry.currentRank}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-700">{entry.username}</div>
                            <div className="text-xs text-gray-400">{entry.totalTests} اختبار</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-black text-amber-600">{entry.totalPoints}</div>
                            <div className="text-xs text-gray-400">نقطة</div>
                          </div>
                          <div>{getRankChangeIcon(entry.rankChange)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : user && userRank ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border-2" style={{ borderColor: GREEN, background: GREEN_LIGHT }}>
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5" style={{ color: GREEN }} />
                    <div>
                      <div className="font-bold text-gray-900">{user.username || user.name} (أنت)</div>
                      <div className="text-xs text-gray-500">{userRank.totalTests || 0} اختبار</div>
                    </div>
                  </div>
                  <div className="text-xl font-black" style={{ color: GREEN }}>{userRank.totalPoints || 0} نقطة</div>
                </div>
                <div className="text-center py-6">
                  <Trophy className="h-10 w-10 mx-auto mb-2" style={{ color: GREEN }} />
                  <p className="text-gray-600">أنت أول المتنافسين! 🎉</p>
                  <p className="text-gray-400 text-sm mt-1">شارك هذا الإنجاز مع أصدقائك</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 mb-1">لا توجد بيانات تصنيف حالياً</p>
                <p className="text-gray-400 text-sm">{user ? "ابدأ بحل الاختبارات لتظهر في التصنيف!" : "سجل دخولك وابدأ رحلتك!"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
