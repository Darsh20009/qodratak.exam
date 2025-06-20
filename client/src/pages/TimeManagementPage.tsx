import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Calendar, 
  Target, 
  BarChart3, 
  CheckCircle, 
  Circle, 
  Play, 
  Pause, 
  RotateCcw,
  Star,
  Flag,
  Timer,
  Users,
  Settings,
  TrendingUp,
  Activity,
  Zap,
  Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Types
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate?: string;
  completed: boolean;
  estimatedTime?: number;
  actualTime?: number;
  subtasks?: Task[];
  tags: string[];
}

interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  target: number;
  completedToday: boolean;
  category: string;
}

interface PomodoroSession {
  duration: number;
  breaks: number;
  completedSessions: number;
  isActive: boolean;
  timeLeft: number;
  isBreak: boolean;
}

const TimeManagementPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [pomodoroSession, setPomodoroSession] = useState<PomodoroSession>({
    duration: 25 * 60, // 25 minutes in seconds
    breaks: 5 * 60, // 5 minutes in seconds
    completedSessions: 0,
    isActive: false,
    timeLeft: 25 * 60,
    isBreak: false
  });
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newHabitOpen, setNewHabitOpen] = useState(false);

  // Sample data initialization
  useEffect(() => {
    const sampleTasks: Task[] = [
      {
        id: '1',
        title: 'مراجعة اختبار القياس',
        description: 'مراجعة الأسئلة الكمية والحلول',
        priority: 'high',
        category: 'دراسة',
        dueDate: '2025-06-21',
        completed: false,
        estimatedTime: 120,
        tags: ['قياس', 'دراسة']
      },
      {
        id: '2',
        title: 'ممارسة الرياضة',
        priority: 'medium',
        category: 'صحة',
        completed: true,
        estimatedTime: 60,
        tags: ['رياضة', 'صحة']
      },
      {
        id: '3',
        title: 'قراءة كتاب',
        priority: 'low',
        category: 'شخصي',
        completed: false,
        estimatedTime: 45,
        tags: ['قراءة', 'تطوير']
      }
    ];

    const sampleHabits: Habit[] = [
      {
        id: '1',
        name: 'شرب 8 أكواب ماء',
        frequency: 'daily',
        streak: 5,
        target: 8,
        completedToday: false,
        category: 'صحة'
      },
      {
        id: '2',
        name: 'قراءة 30 دقيقة',
        frequency: 'daily',
        streak: 12,
        target: 30,
        completedToday: true,
        category: 'تطوير'
      },
      {
        id: '3',
        name: 'ممارسة الرياضة',
        frequency: 'weekly',
        streak: 3,
        target: 3,
        completedToday: false,
        category: 'صحة'
      }
    ];

    setTasks(sampleTasks);
    setHabits(sampleHabits);
  }, []);

  // Pomodoro timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (pomodoroSession.isActive && pomodoroSession.timeLeft > 0) {
      interval = setInterval(() => {
        setPomodoroSession(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (pomodoroSession.timeLeft === 0) {
      // Session completed
      setPomodoroSession(prev => ({
        ...prev,
        isActive: false,
        isBreak: !prev.isBreak,
        timeLeft: prev.isBreak ? prev.duration : prev.breaks,
        completedSessions: prev.isBreak ? prev.completedSessions + 1 : prev.completedSessions
      }));
    }

    return () => clearInterval(interval);
  }, [pomodoroSession.isActive, pomodoroSession.timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePomodoro = () => {
    setPomodoroSession(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };

  const resetPomodoro = () => {
    setPomodoroSession(prev => ({
      ...prev,
      isActive: false,
      timeLeft: prev.duration,
      isBreak: false
    }));
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const toggleHabit = (habitId: string) => {
    setHabits(habits.map(habit => 
      habit.id === habitId ? { 
        ...habit, 
        completedToday: !habit.completedToday,
        streak: !habit.completedToday ? habit.streak + 1 : Math.max(0, habit.streak - 1)
      } : habit
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          وقتي - إدارة الوقت الذكية
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          تمكين المستخدمين من التحكم الكامل في أوقاتهم ومهامهم اليومية والشخصية والمهنية
        </p>
      </div>

      {/* Smart Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المهام اليوم</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}/{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {productivityScore}% معدل الإنجاز
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">جلسات بومودورو</CardTitle>
            <Timer className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pomodoroSession.completedSessions}</div>
            <p className="text-xs text-muted-foreground">
              جلسة مكتملة اليوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العادات النشطة</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{habits.filter(h => h.completedToday).length}/{habits.length}</div>
            <p className="text-xs text-muted-foreground">
              عادة مكتملة اليوم
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نقاط الإنتاجية</CardTitle>
            <Award className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productivityScore * 10}</div>
            <p className="text-xs text-muted-foreground">
              نقطة من 1000
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">لوحة التحكم</TabsTrigger>
          <TabsTrigger value="tasks">المهام</TabsTrigger>
          <TabsTrigger value="calendar">التقويم</TabsTrigger>
          <TabsTrigger value="habits">العادات</TabsTrigger>
          <TabsTrigger value="pomodoro">بومودورو</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  نظرة عامة على اليوم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">تقدم المهام</span>
                    <span className="text-sm">{productivityScore}%</span>
                  </div>
                  <Progress value={productivityScore} className="h-2" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">المهام العاجلة</h4>
                  {tasks.filter(task => task.priority === 'high' && !task.completed).slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <Flag className="h-4 w-4 text-red-600" />
                      <span className="text-sm">{task.title}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Productivity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  إحصائيات الإنتاجية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>أوقات الذروة</span>
                    <Badge variant="secondary">9:00 - 11:00 ص</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>متوسط وقت المهمة</span>
                    <Badge variant="secondary">45 دقيقة</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>أفضل يوم</span>
                    <Badge variant="secondary">الثلاثاء</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personal Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                توصيات شخصية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">تحسين التركيز</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    جرب تقنية بومودورو للمهام التي تتطلب تركيزاً عالياً
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">تنظيم الوقت</h4>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    خصص وقتاً ثابتاً للمهام الروتينية
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">توازن الحياة</h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    لا تنس تخصيص وقت للراحة والاستجمام
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">إدارة المهام</h2>
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  مهمة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة مهمة جديدة</DialogTitle>
                  <DialogDescription>
                    أنشئ مهمة جديدة وحدد تفاصيلها
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task-title">عنوان المهمة</Label>
                    <Input id="task-title" placeholder="مثال: مراجعة اختبار القياس" />
                  </div>
                  <div>
                    <Label htmlFor="task-desc">الوصف</Label>
                    <Textarea id="task-desc" placeholder="تفاصيل إضافية..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">الأولوية</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الأولوية" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">عالية</SelectItem>
                          <SelectItem value="medium">متوسطة</SelectItem>
                          <SelectItem value="low">منخفضة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category">الفئة</Label>
                      <Input id="category" placeholder="مثال: دراسة" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setNewTaskOpen(false)}>إضافة المهمة</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {tasks.map(task => (
              <Card key={task.id} className={task.completed ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="mt-1"
                      >
                        {task.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority === 'high' ? 'عالية' : 
                             task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </Badge>
                          <Badge variant="outline">{task.category}</Badge>
                          {task.estimatedTime && (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.estimatedTime} د
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                التقويم المتكامل
              </CardTitle>
              <CardDescription>
                عرض المهام والأحداث المجدولة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">قريباً: التقويم التفاعلي</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  سيتم إضافة عرض التقويم مع إمكانية جدولة المهام وتخصيص فترات زمنية
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Habits Tab */}
        <TabsContent value="habits" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">تتبع العادات</h2>
            <Dialog open={newHabitOpen} onOpenChange={setNewHabitOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  عادة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة عادة جديدة</DialogTitle>
                  <DialogDescription>
                    أنشئ عادة جديدة وحدد هدفك
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="habit-name">اسم العادة</Label>
                    <Input id="habit-name" placeholder="مثال: شرب 8 أكواب ماء" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="frequency">التكرار</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر التكرار" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">يومي</SelectItem>
                          <SelectItem value="weekly">أسبوعي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="target">الهدف</Label>
                      <Input id="target" type="number" placeholder="8" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setNewHabitOpen(false)}>إضافة العادة</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map(habit => (
              <Card key={habit.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{habit.name}</CardTitle>
                  <CardDescription>
                    {habit.frequency === 'daily' ? 'يومي' : 'أسبوعي'} • 
                    سلسلة: {habit.streak} {habit.frequency === 'daily' ? 'يوم' : 'أسبوع'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">التقدم اليوم</span>
                      <Star className={`h-4 w-4 ${habit.completedToday ? 'text-yellow-500' : 'text-gray-300'}`} />
                    </div>
                    <Button
                      onClick={() => toggleHabit(habit.id)}
                      variant={habit.completedToday ? "default" : "outline"}
                      className="w-full"
                    >
                      {habit.completedToday ? 'مكتمل ✓' : 'وضع علامة كمكتمل'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pomodoro Tab */}
        <TabsContent value="pomodoro" className="space-y-6">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Timer className="h-5 w-5" />
                تقنية بومودورو
              </CardTitle>
              <CardDescription>
                {pomodoroSession.isBreak ? 'وقت الراحة' : 'وقت العمل'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="text-6xl font-mono font-bold">
                {formatTime(pomodoroSession.timeLeft)}
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={togglePomodoro} size="lg">
                  {pomodoroSession.isActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      إيقاف مؤقت
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      بدء
                    </>
                  )}
                </Button>
                <Button onClick={resetPomodoro} variant="outline" size="lg">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  إعادة تعيين
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>الجلسات المكتملة</span>
                  <span>{pomodoroSession.completedSessions}</span>
                </div>
                <Progress 
                  value={(pomodoroSession.completedSessions % 4) * 25} 
                  className="h-2" 
                />
                <p className="text-xs text-gray-500">
                  {4 - (pomodoroSession.completedSessions % 4)} جلسات متبقية للراحة الطويلة
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات بومودورو</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="work-duration">مدة العمل (دقيقة)</Label>
                  <Input id="work-duration" type="number" defaultValue="25" />
                </div>
                <div>
                  <Label htmlFor="break-duration">مدة الراحة (دقيقة)</Label>
                  <Input id="break-duration" type="number" defaultValue="5" />
                </div>
                <div>
                  <Label htmlFor="long-break">الراحة الطويلة (دقيقة)</Label>
                  <Input id="long-break" type="number" defaultValue="15" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeManagementPage;