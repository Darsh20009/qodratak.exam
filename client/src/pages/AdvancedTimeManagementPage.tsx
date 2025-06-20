import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Plus,
  Settings,
  BarChart3,
  BookOpen,
  Timer,
  Brain,
  Award,
  Cog,
  Home,
  Activity,
  Lightbulb,
  Database
} from "lucide-react";
import { timeStorage } from "@/lib/timeStorage";

// Import المكونات المتطورة
import { TaskManager } from "@/components/time-management/TaskManager";
import { HabitTracker } from "@/components/time-management/HabitTracker";
import { PomodoroTimer } from "@/components/time-management/PomodoroTimer";
import { ProductivityDashboard } from "@/components/time-management/ProductivityDashboard";
import { ProjectManager } from "@/components/time-management/ProjectManager";
import { TimeBlockCalendar } from "@/components/time-management/TimeBlockCalendar";
import { AdvancedAnalytics } from "@/components/time-management/AdvancedAnalytics";
import { SmartGoals } from "@/components/time-management/SmartGoals";
import { TimeInsights } from "@/components/time-management/TimeInsights";
import { SettingsAndBackup } from "@/components/time-management/SettingsAndBackup";

export default function AdvancedTimeManagementPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<any>(null);
  const [quickStats, setQuickStats] = useState<any>(null);

  useEffect(() => {
    // تحميل بيانات المستخدم
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // تحميل الإحصائيات السريعة
    loadQuickStats();
  }, []);

  const loadQuickStats = () => {
    const tasks = timeStorage.getTasks();
    const habits = timeStorage.getHabits();
    const analytics = timeStorage.getAnalytics();
    const projects = timeStorage.getProjects();

    const today = new Date().toISOString().split('T')[0];
    const completedTasksToday = tasks.filter(task => 
      task.completedAt && task.completedAt.toISOString().split('T')[0] === today
    ).length;

    const totalHabits = habits.filter(h => h.isActive).length;
    const completedHabitsToday = timeStorage.getHabitLogs().filter(log => 
      log.date === today && log.completed
    ).length;

    const activeProjects = projects.filter(p => p.status === 'active').length;
    
    setQuickStats({
      tasksCompletedToday: completedTasksToday,
      totalTasks: tasks.filter(t => t.status !== 'completed').length,
      habitsCompletedToday: completedHabitsToday,
      totalHabits,
      habitCompletionRate: totalHabits > 0 ? (completedHabitsToday / totalHabits) * 100 : 0,
      activeProjects,
      weeklyProductivityScore: analytics.productivity.daily.slice(-7).reduce((sum: number, day: any) => sum + day.score, 0) / 7
    });
  };

  const getUserGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير";
    if (hour < 17) return "مساء الخير";
    return "مساء الخير";
  };

  const getMotivationalMessage = () => {
    if (!quickStats) return "";
    
    if (quickStats.tasksCompletedToday >= 5) {
      return "🎉 إنجاز رائع! أنت في المسار الصحيح اليوم";
    } else if (quickStats.habitCompletionRate >= 80) {
      return "💪 التزام ممتاز بالعادات! استمر على هذا المنوال";
    } else if (quickStats.weeklyProductivityScore >= 70) {
      return "📈 أداء إنتاجي قوي هذا الأسبوع";
    } else {
      return "🚀 ابدأ يومك بقوة - كل خطوة مهمة!";
    }
  };

  if (!user) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">يرجى تسجيل الدخول أولاً</h2>
        <p className="text-muted-foreground">للوصول إلى نظام إدارة الوقت المتطور</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* ترحيب شخصي */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {getUserGreeting()}, {user.username || user.name}!
            </h1>
            <p className="text-blue-100 mb-4">
              {getMotivationalMessage()}
            </p>
            <div className="text-sm text-blue-100">
              {new Date().toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {quickStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{quickStats.tasksCompletedToday}</div>
                <div className="text-xs text-blue-200">مهام اليوم</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{quickStats.habitCompletionRate.toFixed(0)}%</div>
                <div className="text-xs text-blue-200">العادات</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{quickStats.activeProjects}</div>
                <div className="text-xs text-blue-200">مشاريع نشطة</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{quickStats.weeklyProductivityScore.toFixed(0)}</div>
                <div className="text-xs text-blue-200">نقاط الأسبوع</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* علامات التبويب الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-10">
          <TabsTrigger value="dashboard" className="flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">لوحة التحكم</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">المهام</span>
          </TabsTrigger>
          <TabsTrigger value="habits" className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">العادات</span>
          </TabsTrigger>
          <TabsTrigger value="pomodoro" className="flex items-center gap-1">
            <Timer className="w-4 h-4" />
            <span className="hidden sm:inline">بومودورو</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">المشاريع</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">التقويم</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">الأهداف</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">التحليلات</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">الرؤى</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <Cog className="w-4 h-4" />
            <span className="hidden sm:inline">الإعدادات</span>
          </TabsTrigger>
        </TabsList>

        {/* محتوى علامات التبويب */}
        <TabsContent value="dashboard" className="mt-6">
          <ProductivityDashboard 
            userId={user.id} 
            tasks={timeStorage.getTasks()}
            habits={timeStorage.getHabits()}
            projects={timeStorage.getProjects()}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TaskManager 
            userId={user.id}
            tasks={timeStorage.getTasks()}
            projects={timeStorage.getProjects()}
          />
        </TabsContent>

        <TabsContent value="habits" className="mt-6">
          <HabitTracker 
            userId={user.id}
            habits={timeStorage.getHabits()}
          />
        </TabsContent>

        <TabsContent value="pomodoro" className="mt-6">
          <PomodoroTimer 
            userId={user.id}
            tasks={timeStorage.getTasks()}
          />
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <ProjectManager 
            userId={user.id}
            projects={timeStorage.getProjects()}
            tasks={timeStorage.getTasks()}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <TimeBlockCalendar userId={user.id} tasks={timeStorage.getTasks()} />
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <SmartGoals userId={user.id} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AdvancedAnalytics userId={user.id} />
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <TimeInsights userId={user.id} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsAndBackup userId={user.id} />
        </TabsContent>
      </Tabs>

      {/* شريط الحالة السفلي */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex gap-2">
          {/* مؤشر حالة التخزين */}
          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  محفوظ محلياً
                </span>
              </div>
            </CardContent>
          </Card>

          {/* زر الوصول السريع للمهام */}
          <Button
            size="sm"
            variant="outline"
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm"
            onClick={() => setActiveTab('tasks')}
          >
            <Plus className="w-4 h-4 mr-1" />
            مهمة سريعة
          </Button>
        </div>
      </div>

      {/* نصائح الاستخدام للمستخدمين الجدد */}
      {quickStats && quickStats.tasksCompletedToday === 0 && quickStats.habitsCompletedToday === 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  ابدأ رحلتك في إدارة الوقت
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  مرحباً بك في نظام إدارة الوقت المتطور! إليك بعض النصائح للبداية:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• ابدأ بإضافة مهمة بسيطة في قسم "المهام"</li>
                  <li>• أضف عادة يومية واحدة في قسم "العادات"</li>
                  <li>• جرب تقنية البومودورو لزيادة التركيز</li>
                  <li>• راجع "الرؤى الذكية" للحصول على نصائح مخصصة</li>
                </ul>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => setActiveTab('tasks')}>
                    إضافة مهمة
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('habits')}>
                    إضافة عادة
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}