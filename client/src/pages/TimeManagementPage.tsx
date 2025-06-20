import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  CheckCircle2, 
  Plus, 
  Target, 
  Calendar,
  Timer,
  TrendingUp,
  BarChart3,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Flame,
  Calendar as CalendarIcon,
  FolderOpen,
  Users,
  CheckSquare,
  Activity
} from "lucide-react";
import { TaskManager } from "@/components/time-management/TaskManager";
import { HabitTracker } from "@/components/time-management/HabitTracker";
import { PomodoroTimer } from "@/components/time-management/PomodoroTimer";
import { ProductivityDashboard } from "@/components/time-management/ProductivityDashboard";
import { ProjectManager } from "@/components/time-management/ProjectManager";
import { TimeBlockCalendar } from "@/components/time-management/TimeBlockCalendar";

const TimeManagementPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      return {
        id: 1,
        username: "مستخدم",
        points: 50,
        level: 1
      };
    }
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const response = await fetch(`/api/tasks/${user.id}`);
        return await response.json();
      } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }
    },
    enabled: !!user?.id
  });

  // Fetch habits
  const { data: habits = [] } = useQuery({
    queryKey: ["/api/habits", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const response = await fetch(`/api/habits/${user.id}`);
        return await response.json();
      } catch (error) {
        console.error("Error fetching habits:", error);
        return [];
      }
    },
    enabled: !!user?.id
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const response = await fetch(`/api/projects/${user.id}`);
        return await response.json();
      } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
      }
    },
    enabled: !!user?.id
  });

  // Calculate productivity stats
  const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const urgentTasks = tasks.filter((task: any) => 
    task.priority === 'high' && task.status !== 'completed'
  ).length;

  const todayHabits = habits.filter((habit: any) => habit.isActive).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">وقتي</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              منصة إدارة الوقت والإنتاجية الشخصية
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">المهام المكتملة</p>
                  <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-blue-500" />
              </div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">المهام العاجلة</p>
                  <p className="text-2xl font-bold text-red-600">{urgentTasks}</p>
                </div>
                <Target className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">العادات النشطة</p>
                  <p className="text-2xl font-bold text-green-600">{todayHabits}</p>
                </div>
                <Flame className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">المشاريع</p>
                  <p className="text-2xl font-bold text-purple-600">{projects.length}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">لوحة التحكم</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">المهام</span>
          </TabsTrigger>
          <TabsTrigger value="habits" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">العادات</span>
          </TabsTrigger>
          <TabsTrigger value="pomodoro" className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span className="hidden sm:inline">بومودورو</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span className="hidden sm:inline">التقويم</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">المشاريع</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <ProductivityDashboard 
            tasks={tasks}
            habits={habits}
            projects={projects}
            userId={user?.id}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <TaskManager 
            userId={user?.id}
            tasks={tasks}
            projects={projects}
          />
        </TabsContent>

        <TabsContent value="habits" className="space-y-6">
          <HabitTracker 
            userId={user?.id}
            habits={habits}
          />
        </TabsContent>

        <TabsContent value="pomodoro" className="space-y-6">
          <PomodoroTimer 
            userId={user?.id}
            tasks={tasks}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <TimeBlockCalendar 
            userId={user?.id}
            tasks={tasks}
          />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <ProjectManager 
            userId={user?.id}
            projects={projects}
            tasks={tasks}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeManagementPage;