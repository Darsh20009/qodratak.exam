import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Clock, 
  Target, 
  CheckCircle2,
  Calendar,
  Flame,
  BarChart3,
  PieChart
} from "lucide-react";

interface ProductivityDashboardProps {
  tasks: any[];
  habits: any[];
  projects: any[];
  userId: number;
}

export const ProductivityDashboard = ({ tasks, habits, projects }: ProductivityDashboardProps) => {
  // Calculate productivity metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const urgentTasks = tasks.filter(task => 
    task.priority === 'high' && task.status !== 'completed'
  ).length;
  
  const overdueTasks = tasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
  ).length;

  // Weekly productivity (mock data for now)
  const weeklyData = [
    { day: 'السبت', completed: 3, total: 5 },
    { day: 'الأحد', completed: 4, total: 6 },
    { day: 'الاثنين', completed: 2, total: 4 },
    { day: 'الثلاثاء', completed: 5, total: 7 },
    { day: 'الأربعاء', completed: 3, total: 5 },
    { day: 'الخميس', completed: 4, total: 6 },
    { day: 'الجمعة', completed: 1, total: 2 }
  ];

  const categoryStats = [
    { name: 'عمل', count: tasks.filter(t => t.category === 'work').length, color: 'bg-blue-500' },
    { name: 'شخصي', count: tasks.filter(t => t.category === 'personal').length, color: 'bg-green-500' },
    { name: 'دراسة', count: tasks.filter(t => t.category === 'study').length, color: 'bg-purple-500' },
    { name: 'لياقة', count: tasks.filter(t => t.category === 'fitness').length, color: 'bg-orange-500' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">لوحة الإنتاجية</h2>
        <p className="text-gray-600 dark:text-gray-400">
          نظرة شاملة على تقدمك وإنتاجيتك
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">معدل الإنجاز</p>
                <p className="text-2xl font-bold text-green-600">{Math.round(completionRate)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">المهام المكتملة</p>
                <p className="text-2xl font-bold">{completedTasks}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">من أصل {totalTasks} مهمة</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">العادات النشطة</p>
                <p className="text-2xl font-bold text-purple-600">{habits.length}</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">عادة يومية</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">المشاريع</p>
                <p className="text-2xl font-bold text-orange-600">{projects.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">مشروع نشط</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            التقدم الأسبوعي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyData.map((day, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-600">{day.day}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{day.completed}/{day.total} مهمة</span>
                    <span>{Math.round((day.completed / day.total) * 100)}%</span>
                  </div>
                  <Progress value={(day.completed / day.total) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Task Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              حالة المهام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">مكتملة</span>
                </div>
                <Badge variant="outline">{completedTasks}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">قيد التنفيذ</span>
                </div>
                <Badge variant="outline">{inProgressTasks}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-sm">قيد الانتظار</span>
                </div>
                <Badge variant="outline">{pendingTasks}</Badge>
              </div>
              
              {urgentTasks > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">عاجلة</span>
                  </div>
                  <Badge variant="destructive">{urgentTasks}</Badge>
                </div>
              )}
              
              {overdueTasks > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">متأخرة</span>
                  </div>
                  <Badge variant="destructive">{overdueTasks}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع المهام حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryStats.map((category, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{category.count}</Badge>
                      <div className="w-20">
                        <Progress 
                          value={totalTasks > 0 ? (category.count / totalTasks) * 100 : 0} 
                          className="h-1" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5" />
            نصائح لزيادة الإنتاجية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">تنظيم المهام:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• رتب المهام حسب الأولوية</li>
                <li>• قسم المهام الكبيرة إلى خطوات صغيرة</li>
                <li>• حدد مواعيد نهائية واقعية</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">إدارة الوقت:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• استخدم تقنية بومودورو</li>
                <li>• خذ فترات راحة منتظمة</li>
                <li>• تجنب المشتتات أثناء العمل</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};