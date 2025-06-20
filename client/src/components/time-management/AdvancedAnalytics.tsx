import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Calendar,
  Award,
  Flame,
  Activity,
  Brain,
  Zap,
  Star
} from "lucide-react";
import { timeStorage, Analytics } from "@/lib/timeStorage";

interface AdvancedAnalyticsProps {
  userId: number;
}

export const AdvancedAnalytics = ({ userId }: AdvancedAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    const data = timeStorage.getAnalytics();
    setAnalytics(data);
  }, []);

  if (!analytics) {
    return <div>جاري التحميل...</div>;
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const productivityData = analytics.productivity.daily.slice(-7).map(day => ({
    date: new Date(day.date).toLocaleDateString('ar-SA', { weekday: 'short' }),
    score: day.score,
    tasks: day.tasksCompleted,
    hours: Math.round(day.timeSpent / 60 * 10) / 10
  }));

  const categoryData = analytics.timeTracking.categoryBreakdown.map((cat, index) => ({
    name: getCategoryNameArabic(cat.category),
    value: cat.minutes,
    percentage: cat.percentage,
    color: COLORS[index % COLORS.length]
  }));

  const peakHoursData = analytics.timeTracking.peakHours.slice(0, 8).map(hour => ({
    hour: `${hour.hour}:00`,
    productivity: Math.round(hour.productivity * 10) / 10
  }));

  const habitStatsData = analytics.habits.categoryStats.map((stat, index) => ({
    category: getCategoryNameArabic(stat.category),
    rate: Math.round(stat.completionRate),
    color: COLORS[index % COLORS.length]
  }));

  function getCategoryNameArabic(category: string): string {
    const translations: { [key: string]: string } = {
      'work': 'عمل',
      'personal': 'شخصي',
      'study': 'دراسة',
      'fitness': 'لياقة',
      'health': 'صحة',
      'family': 'عائلة',
      'learning': 'تعلم',
      'productivity': 'إنتاجية',
      'social': 'اجتماعي',
      'spiritual': 'روحي'
    };
    return translations[category] || category;
  }

  const weeklyScore = Math.round(
    productivityData.reduce((sum, day) => sum + day.score, 0) / productivityData.length
  );

  const totalHoursThisWeek = productivityData.reduce((sum, day) => sum + day.hours, 0);
  const totalTasksThisWeek = productivityData.reduce((sum, day) => sum + day.tasks, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">التحليلات المتقدمة</h2>
          <p className="text-gray-600 dark:text-gray-400">
            رؤى عميقة حول إنتاجيتك وعاداتك
          </p>
        </div>
      </div>

      {/* نظرة عامة سريعة */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">النقاط الأسبوعية</p>
                <p className="text-2xl font-bold">{weeklyScore}</p>
                <p className="text-blue-100 text-xs">من 100</p>
              </div>
              <Star className="w-8 h-8 text-blue-200" />
            </div>
            <Progress value={weeklyScore} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">المهام المكتملة</p>
                <p className="text-2xl font-bold">{totalTasksThisWeek}</p>
                <p className="text-green-100 text-xs">هذا الأسبوع</p>
              </div>
              <Target className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">ساعات العمل</p>
                <p className="text-2xl font-bold">{totalHoursThisWeek.toFixed(1)}</p>
                <p className="text-purple-100 text-xs">هذا الأسبوع</p>
              </div>
              <Clock className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">معدل العادات</p>
                <p className="text-2xl font-bold">{analytics.habits.completionRate.toFixed(0)}%</p>
                <p className="text-orange-100 text-xs">اليوم</p>
              </div>
              <Flame className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="productivity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="productivity">الإنتاجية</TabsTrigger>
          <TabsTrigger value="time">الوقت</TabsTrigger>
          <TabsTrigger value="habits">العادات</TabsTrigger>
          <TabsTrigger value="insights">الرؤى</TabsTrigger>
        </TabsList>

        <TabsContent value="productivity" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  منحنى الإنتاجية الأسبوعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={productivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        value, 
                        name === 'score' ? 'النقاط' : name === 'tasks' ? 'المهام' : 'الساعات'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  المهام والساعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="#10B981" name="المهام" />
                    <Bar dataKey="hours" fill="#F59E0B" name="الساعات" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                ساعات الذروة - أوقات أعلى إنتاجية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={peakHoursData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="hour" type="category" width={60} />
                  <Tooltip formatter={(value) => [value, 'الإنتاجية']} />
                  <Bar dataKey="productivity" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>توزيع الوقت حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value} دقيقة`, 'الوقت']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تفاصيل الوقت</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryData.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(category.value / 60 * 10) / 10} ساعة
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="habits" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>أداء العادات حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={habitStatsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'معدل الإنجاز']} />
                    <Bar dataKey="rate" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أقوى الخطوط المستمرة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.habits.streakData
                  .sort((a, b) => b.streak - a.streak)
                  .slice(0, 5)
                  .map((streak, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                          <Flame className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="font-medium">عادة #{streak.habitId.slice(-1)}</span>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {streak.streak} يوم
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid md:grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  رؤى ذكية وتوصيات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {generateInsights(analytics).map((insight, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${insight.color}`}>
                        <insight.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">{insight.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{insight.description}</p>
                        {insight.action && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
                            💡 {insight.action}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

function generateInsights(analytics: Analytics) {
  const insights = [];
  
  // رؤى الإنتاجية
  const avgScore = analytics.productivity.daily.reduce((sum, day) => sum + day.score, 0) / analytics.productivity.daily.length;
  if (avgScore < 50) {
    insights.push({
      icon: TrendingUp,
      color: 'bg-blue-500',
      title: 'فرصة لتحسين الإنتاجية',
      description: `متوسط نقاطك الأسبوعي ${avgScore.toFixed(0)} من 100. هناك مجال للتحسن!`,
      action: 'جرب تقسيم المهام الكبيرة إلى مهام أصغر وأكثر قابلية للإنجاز'
    });
  }

  // رؤى العادات
  if (analytics.habits.completionRate < 70) {
    insights.push({
      icon: Target,
      color: 'bg-green-500',
      title: 'تحسين العادات اليومية',
      description: `معدل إنجاز عاداتك اليوم ${analytics.habits.completionRate.toFixed(0)}%. يمكنك الوصول لمستوى أفضل!`,
      action: 'ابدأ بعادة واحدة فقط وركز عليها حتى تصبح تلقائية'
    });
  }

  // رؤى إدارة الوقت
  const workCategory = analytics.timeTracking.categoryBreakdown.find(cat => cat.category === 'work');
  if (workCategory && workCategory.percentage > 60) {
    insights.push({
      icon: Clock,
      color: 'bg-orange-500',
      title: 'توازن أفضل في الحياة',
      description: `تقضي ${workCategory.percentage.toFixed(0)}% من وقتك في العمل. فكر في المزيد من التوازن.`,
      action: 'خصص وقتاً أكثر للأنشطة الشخصية والاسترخاء'
    });
  }

  // رؤى الأهداف
  if (analytics.goals.overdue > 0) {
    insights.push({
      icon: Calendar,
      color: 'bg-red-500',
      title: 'مهام متأخرة تحتاج انتباه',
      description: `لديك ${analytics.goals.overdue} مهمة متأخرة عن موعدها المحدد.`,
      action: 'راجع أولوياتك وأعد جدولة المهام المتأخرة'
    });
  }

  // رؤى إيجابية
  const bestStreak = Math.max(...analytics.habits.streakData.map(s => s.streak), 0);
  if (bestStreak >= 7) {
    insights.push({
      icon: Award,
      color: 'bg-purple-500',
      title: 'إنجاز رائع في العادات!',
      description: `أطول خط مستمر لديك هو ${bestStreak} يوم. استمر على هذا المنوال!`,
      action: 'حافظ على هذا الزخم وفكر في إضافة عادة جديدة'
    });
  }

  // إذا لم تكن هناك رؤى كافية، أضف نصائح عامة
  if (insights.length < 3) {
    insights.push({
      icon: Brain,
      color: 'bg-indigo-500',
      title: 'نصيحة للتطوير',
      description: 'أداؤك جيد! جرب تحديد هدف جديد لتحدي نفسك أكثر.',
      action: 'حدد هدفاً أسبوعياً جديداً لزيادة دافعيتك'
    });
  }

  return insights.slice(0, 5); // أقصى 5 رؤى
}