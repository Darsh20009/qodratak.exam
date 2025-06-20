import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  TrendingUp, 
  Calendar, 
  Clock,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Zap,
  Award,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { timeStorage } from "@/lib/timeStorage";

interface TimeInsightsProps {
  userId: number;
}

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  category: 'productivity' | 'habits' | 'time' | 'goals';
  title: string;
  description: string;
  action?: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
}

export const TimeInsights = ({ userId }: TimeInsightsProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  useEffect(() => {
    generateInsights();
  }, [timeRange]);

  const generateInsights = () => {
    const analytics = timeStorage.getAnalytics();
    const tasks = timeStorage.getTasks();
    const habits = timeStorage.getHabits();
    const habitLogs = timeStorage.getHabitLogs();
    const settings = timeStorage.getSettings();

    const generatedInsights: Insight[] = [];

    // تحليل الإنتاجية
    const productivityInsights = analyzeProductivity(analytics, tasks);
    generatedInsights.push(...productivityInsights);

    // تحليل العادات
    const habitInsights = analyzeHabits(analytics, habits, habitLogs);
    generatedInsights.push(...habitInsights);

    // تحليل إدارة الوقت
    const timeInsights = analyzeTimeManagement(analytics, tasks);
    generatedInsights.push(...timeInsights);

    // تحليل الأهداف
    const goalInsights = analyzeGoals(analytics);
    generatedInsights.push(...goalInsights);

    // ترتيب الرؤى حسب الأهمية والثقة
    generatedInsights.sort((a, b) => {
      const severityWeight = { high: 3, medium: 2, low: 1 };
      const aScore = severityWeight[a.severity] * a.confidence;
      const bScore = severityWeight[b.severity] * b.confidence;
      return bScore - aScore;
    });

    setInsights(generatedInsights.slice(0, 10)); // أفضل 10 رؤى
  };

  const analyzeProductivity = (analytics: any, tasks: any[]): Insight[] => {
    const insights: Insight[] = [];
    
    // تحليل منحنى الإنتاجية
    const dailyScores = analytics.productivity.daily.slice(-7);
    const avgScore = dailyScores.reduce((sum: number, day: any) => sum + day.score, 0) / dailyScores.length;
    const trend = calculateTrend(dailyScores.map((d: any) => d.score));

    if (avgScore < 40) {
      insights.push({
        id: 'low_productivity',
        type: 'warning',
        category: 'productivity',
        title: 'مستوى إنتاجية منخفض',
        description: `متوسط نقاط الإنتاجية ${avgScore.toFixed(0)} من 100. هناك فرصة كبيرة للتحسن.`,
        action: 'جرب تقسيم المهام الكبيرة وحدد أولويات واضحة',
        severity: 'high',
        confidence: 85
      });
    } else if (avgScore > 80) {
      insights.push({
        id: 'high_productivity',
        type: 'success',
        category: 'productivity',
        title: 'إنتاجية ممتازة!',
        description: `تحقق نقاط إنتاجية عالية ${avgScore.toFixed(0)} من 100. استمر على هذا المنوال!`,
        action: 'فكر في مشاركة استراتيجياتك مع الآخرين',
        severity: 'low',
        confidence: 90
      });
    }

    if (trend > 0.2) {
      insights.push({
        id: 'improving_trend',
        type: 'success',
        category: 'productivity',
        title: 'اتجاه تصاعدي في الإنتاجية',
        description: 'إنتاجيتك تتحسن باستمرار خلال الأسبوع الماضي.',
        action: 'حدد العوامل التي ساعدت في التحسن وعززها',
        severity: 'medium',
        confidence: 75
      });
    } else if (trend < -0.2) {
      insights.push({
        id: 'declining_trend',
        type: 'warning',
        category: 'productivity',
        title: 'انخفاض في الإنتاجية',
        description: 'لوحظ انخفاض في مستوى الإنتاجية خلال الأيام الأخيرة.',
        action: 'راجع ما تغير في روتينك وعدل استراتيجيتك',
        severity: 'medium',
        confidence: 80
      });
    }

    // تحليل المهام المتأخرة
    const overdueTasks = tasks.filter(task => 
      task.dueDate && task.dueDate < new Date() && task.status !== 'completed'
    );

    if (overdueTasks.length > 3) {
      insights.push({
        id: 'many_overdue_tasks',
        type: 'warning',
        category: 'productivity',
        title: 'مهام متأخرة كثيرة',
        description: `لديك ${overdueTasks.length} مهمة متأخرة عن موعدها.`,
        action: 'أعد ترتيب أولوياتك وركز على المهام المتأخرة',
        severity: 'high',
        confidence: 95
      });
    }

    return insights;
  };

  const analyzeHabits = (analytics: any, habits: any[], habitLogs: any[]): Insight[] => {
    const insights: Insight[] = [];
    
    // تحليل معدل إنجاز العادات
    const completionRate = analytics.habits.completionRate;
    
    if (completionRate < 50) {
      insights.push({
        id: 'low_habit_completion',
        type: 'warning',
        category: 'habits',
        title: 'معدل إنجاز عادات منخفض',
        description: `معدل إنجاز عاداتك ${completionRate.toFixed(0)}%. ابدأ بعادات أسهل.`,
        action: 'قلل عدد العادات وركز على 2-3 عادات رئيسية',
        severity: 'medium',
        confidence: 85
      });
    } else if (completionRate > 80) {
      insights.push({
        id: 'excellent_habits',
        type: 'success',
        category: 'habits',
        title: 'التزام ممتاز بالعادات',
        description: `تحقق معدل إنجاز ${completionRate.toFixed(0)}% في عاداتك!`,
        action: 'فكر في إضافة عادة جديدة لتطوير نفسك أكثر',
        severity: 'low',
        confidence: 90
      });
    }

    // تحليل الخطوط المستمرة
    const bestStreak = Math.max(...analytics.habits.streakData.map((s: any) => s.streak), 0);
    if (bestStreak >= 21) {
      insights.push({
        id: 'strong_streak',
        type: 'success',
        category: 'habits',
        title: 'خط مستمر قوي',
        description: `أطول خط مستمر لديك ${bestStreak} يوم. العادة أصبحت جزءاً منك!`,
        action: 'استخدم هذا النجاح كدافع لعادات جديدة',
        severity: 'low',
        confidence: 95
      });
    }

    // تحليل العادات المنقطعة
    const brokenStreaks = habits.filter(habit => 
      habit.streak === 0 && habit.longestStreak > 7
    );

    if (brokenStreaks.length > 0) {
      insights.push({
        id: 'broken_streaks',
        type: 'info',
        category: 'habits',
        title: 'عادات انقطعت مؤخراً',
        description: `${brokenStreaks.length} عادة انقطعت بعد خط مستمر جيد.`,
        action: 'ابدأ من جديد مع هذه العادات - التراكم أهم من الكمال',
        severity: 'medium',
        confidence: 70
      });
    }

    return insights;
  };

  const analyzeTimeManagement = (analytics: any, tasks: any[]): Insight[] => {
    const insights: Insight[] = [];
    
    // تحليل توزيع الوقت
    const categoryBreakdown = analytics.timeTracking.categoryBreakdown;
    const workCategory = categoryBreakdown.find((cat: any) => cat.category === 'work');
    
    if (workCategory && workCategory.percentage > 70) {
      insights.push({
        id: 'work_life_imbalance',
        type: 'warning',
        category: 'time',
        title: 'خلل في توازن الحياة والعمل',
        description: `${workCategory.percentage.toFixed(0)}% من وقتك مخصص للعمل.`,
        action: 'خصص وقتاً أكثر للراحة والأنشطة الشخصية',
        severity: 'medium',
        confidence: 80
      });
    }

    // تحليل ساعات الذروة
    const peakHours = analytics.timeTracking.peakHours;
    if (peakHours.length > 0) {
      const topHour = peakHours[0];
      insights.push({
        id: 'peak_productivity_time',
        type: 'tip',
        category: 'time',
        title: 'ساعة ذروة الإنتاجية',
        description: `أعلى إنتاجية لديك في الساعة ${topHour.hour}:00.`,
        action: 'جدول أصعب المهام في هذا الوقت',
        severity: 'low',
        confidence: 85
      });
    }

    // تحليل تقدير الوقت
    const tasksWithEstimates = tasks.filter(task => task.estimatedTime && task.actualTime);
    if (tasksWithEstimates.length > 5) {
      const accuracyRatio = tasksWithEstimates.reduce((sum, task) => {
        const accuracy = Math.min(task.estimatedTime!, task.actualTime!) / Math.max(task.estimatedTime!, task.actualTime!);
        return sum + accuracy;
      }, 0) / tasksWithEstimates.length;

      if (accuracyRatio < 0.7) {
        insights.push({
          id: 'poor_time_estimation',
          type: 'info',
          category: 'time',
          title: 'تحسين تقدير الوقت',
          description: `دقة تقدير الوقت ${(accuracyRatio * 100).toFixed(0)}%. هناك مجال للتحسن.`,
          action: 'راقب الوقت الفعلي وحسن تقديراتك تدريجياً',
          severity: 'medium',
          confidence: 75
        });
      }
    }

    return insights;
  };

  const analyzeGoals = (analytics: any): Insight[] => {
    const insights: Insight[] = [];
    
    const goals = analytics.goals;
    
    if (goals.completionRate < 30) {
      insights.push({
        id: 'low_goal_completion',
        type: 'warning',
        category: 'goals',
        title: 'معدل إنجاز أهداف منخفض',
        description: `معدل إنجاز أهدافك ${goals.completionRate.toFixed(0)}%.`,
        action: 'راجع أهدافك وتأكد أنها واقعية وقابلة للتحقيق',
        severity: 'medium',
        confidence: 80
      });
    }

    if (goals.overdue > 0) {
      insights.push({
        id: 'overdue_goals',
        type: 'warning',
        category: 'goals',
        title: 'أهداف متأخرة',
        description: `${goals.overdue} هدف تجاوز الموعد المحدد.`,
        action: 'أعد تقييم الأهداف المتأخرة وعدل الجدولة',
        severity: 'high',
        confidence: 90
      });
    }

    return insights;
  };

  const calculateTrend = (values: number[]): number => {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumX2 = values.reduce((sum, _, idx) => sum + idx * idx, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope / (sumY / n); // normalize by average value
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Brain className="w-5 h-5 text-blue-500" />;
      case 'tip': return <Lightbulb className="w-5 h-5 text-purple-500" />;
      default: return <Brain className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'info': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      case 'tip': return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productivity': return <TrendingUp className="w-4 h-4" />;
      case 'habits': return <Target className="w-4 h-4" />;
      case 'time': return <Clock className="w-4 h-4" />;
      case 'goals': return <Award className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  const insightCounts = {
    all: insights.length,
    productivity: insights.filter(i => i.category === 'productivity').length,
    habits: insights.filter(i => i.category === 'habits').length,
    time: insights.filter(i => i.category === 'time').length,
    goals: insights.filter(i => i.category === 'goals').length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">الرؤى الذكية</h2>
          <p className="text-gray-600 dark:text-gray-400">
            تحليل ذكي لأدائك وتوصيات مخصصة
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={generateInsights}
          >
            <Zap className="w-4 h-4 mr-2" />
            تحديث التحليل
          </Button>
        </div>
      </div>

      {/* نظرة عامة سريعة */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">إجمالي الرؤى</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
              <Brain className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">نجاحات</p>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.type === 'success').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">تحذيرات</p>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.type === 'warning').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">نصائح</p>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.type === 'tip').length}
                </p>
              </div>
              <Lightbulb className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فلاتر الفئات */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          الكل ({insightCounts.all})
        </Button>
        
        {(['productivity', 'habits', 'time', 'goals'] as const).map(category => {
          const count = insightCounts[category];
          if (count === 0) return null;
          
          const categoryNames = {
            productivity: 'الإنتاجية',
            habits: 'العادات',
            time: 'الوقت',
            goals: 'الأهداف'
          };
          
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex items-center gap-1"
            >
              {getCategoryIcon(category)}
              {categoryNames[category]} ({count})
            </Button>
          );
        })}
      </div>

      {/* قائمة الرؤى */}
      <div className="space-y-4">
        {filteredInsights.map(insight => (
          <Card key={insight.id} className={`${getInsightColor(insight.type)} border`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{insight.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryIcon(insight.category)}
                          <span className="mr-1">
                            {insight.category === 'productivity' ? 'إنتاجية' :
                             insight.category === 'habits' ? 'عادات' :
                             insight.category === 'time' ? 'وقت' : 'أهداف'}
                          </span>
                        </Badge>
                        
                        <Badge 
                          variant="outline" 
                          className={
                            insight.severity === 'high' ? 'border-red-300 text-red-700' :
                            insight.severity === 'medium' ? 'border-yellow-300 text-yellow-700' :
                            'border-green-300 text-green-700'
                          }
                        >
                          {insight.severity === 'high' ? 'عالي' :
                           insight.severity === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {insight.confidence}%
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {insight.description}
                  </p>
                  
                  {insight.action && (
                    <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800 dark:text-blue-200">
                          خطة العمل
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        {insight.action}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInsights.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد رؤى متاحة</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              استخدم النظام أكثر لتحصل على رؤى مخصصة
            </p>
            <Button onClick={generateInsights}>
              <Zap className="w-4 h-4 mr-2" />
              تحديث التحليل
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};