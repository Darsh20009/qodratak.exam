import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Timer,
  BookOpen,
  Dumbbell,
  Briefcase,
  Heart,
  Users,
  Star,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Trophy,
  Flame,
  CheckSquare,
  Circle,
  Edit,
  Trash2,
  BarChart3
} from 'lucide-react';

// أنواع البيانات المبسطة
interface Task {
  id: string;
  title: string;
  description?: string;
  category: 'work' | 'personal' | 'study' | 'health';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  dueDate?: string;
  estimatedTime?: number;
  createdAt: string;
}

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: 'health' | 'learning' | 'productivity' | 'personal';
  frequency: 'daily' | 'weekly';
  streak: number;
  completedToday: boolean;
  target: number;
  unit: string;
}

interface PomodoroTimer {
  isActive: boolean;
  timeLeft: number;
  duration: number;
  sessionsCompleted: number;
  isBreak: boolean;
}

const NewTimeManagementPage: React.FC = () => {
  // حالات البيانات
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [pomodoroTimer, setPomodoroTimer] = useState<PomodoroTimer>({
    isActive: false,
    timeLeft: 25 * 60, // 25 دقيقة
    duration: 25 * 60,
    sessionsCompleted: 0,
    isBreak: false
  });

  // حالات واجهة المستخدم
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showHabitDialog, setShowHabitDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // نموذج مهمة جديدة
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'work' as const,
    priority: 'medium' as const,
    dueDate: '',
    estimatedTime: 30
  });

  // نموذج عادة جديدة
  const [newHabit, setNewHabit] = useState({
    name: '',
    icon: '⭐',
    color: '#3B82F6',
    category: 'productivity' as const,
    frequency: 'daily' as const,
    target: 1,
    unit: 'مرة'
  });

  // تحميل البيانات من التخزين المحلي
  useEffect(() => {
    const savedTasks = localStorage.getItem('time_management_tasks');
    const savedHabits = localStorage.getItem('time_management_habits');
    const savedPomodoro = localStorage.getItem('time_management_pomodoro');

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // بيانات تجريبية
      const sampleTasks: Task[] = [
        {
          id: '1',
          title: 'مراجعة أسئلة الرياضيات',
          description: 'حل 20 سؤال من كتاب القياس',
          category: 'study',
          priority: 'high',
          completed: false,
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          estimatedTime: 60,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'كتابة التقرير الشهري',
          category: 'work',
          priority: 'medium',
          completed: true,
          estimatedTime: 120,
          createdAt: new Date().toISOString()
        }
      ];
      setTasks(sampleTasks);
    }

    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    } else {
      // عادات تجريبية
      const sampleHabits: Habit[] = [
        {
          id: '1',
          name: 'شرب الماء',
          icon: '💧',
          color: '#3B82F6',
          category: 'health',
          frequency: 'daily',
          streak: 5,
          completedToday: false,
          target: 8,
          unit: 'كوب'
        },
        {
          id: '2',
          name: 'القراءة',
          icon: '📚',
          color: '#10B981',
          category: 'learning',
          frequency: 'daily',
          streak: 12,
          completedToday: true,
          target: 30,
          unit: 'دقيقة'
        },
        {
          id: '3',
          name: 'التمارين الرياضية',
          icon: '🏃‍♂️',
          color: '#F59E0B',
          category: 'health',
          frequency: 'daily',
          streak: 3,
          completedToday: false,
          target: 20,
          unit: 'دقيقة'
        }
      ];
      setHabits(sampleHabits);
    }

    if (savedPomodoro) {
      setPomodoroTimer(JSON.parse(savedPomodoro));
    }
  }, []);

  // حفظ البيانات في التخزين المحلي
  useEffect(() => {
    localStorage.setItem('time_management_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('time_management_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('time_management_pomodoro', JSON.stringify(pomodoroTimer));
  }, [pomodoroTimer]);

  // مؤقت البومودورو
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (pomodoroTimer.isActive && pomodoroTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setPomodoroTimer(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (pomodoroTimer.timeLeft === 0) {
      // انتهاء الجلسة
      setPomodoroTimer(prev => ({
        ...prev,
        isActive: false,
        isBreak: !prev.isBreak,
        timeLeft: prev.isBreak ? 25 * 60 : 5 * 60,
        sessionsCompleted: prev.isBreak ? prev.sessionsCompleted : prev.sessionsCompleted + 1
      }));
      
      // إشعار صوتي (اختياري)
      if ('Notification' in window) {
        new Notification(pomodoroTimer.isBreak ? 'وقت العمل!' : 'وقت الراحة!');
      }
    }

    return () => clearInterval(interval);
  }, [pomodoroTimer.isActive, pomodoroTimer.timeLeft]);

  // دوال إدارة المهام
  const addTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      priority: newTask.priority,
      completed: false,
      dueDate: newTask.dueDate || undefined,
      estimatedTime: newTask.estimatedTime,
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [...prev, task]);
    setNewTask({
      title: '',
      description: '',
      category: 'work',
      priority: 'medium',
      dueDate: '',
      estimatedTime: 30
    });
    setShowTaskDialog(false);
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // دوال إدارة العادات
  const addHabit = () => {
    if (!newHabit.name.trim()) return;

    const habit: Habit = {
      id: Date.now().toString(),
      name: newHabit.name,
      icon: newHabit.icon,
      color: newHabit.color,
      category: newHabit.category,
      frequency: newHabit.frequency,
      streak: 0,
      completedToday: false,
      target: newHabit.target,
      unit: newHabit.unit
    };

    setHabits(prev => [...prev, habit]);
    setNewHabit({
      name: '',
      icon: '⭐',
      color: '#3B82F6',
      category: 'productivity',
      frequency: 'daily',
      target: 1,
      unit: 'مرة'
    });
    setShowHabitDialog(false);
  };

  const toggleHabit = (habitId: string) => {
    setHabits(prev => prev.map(habit => 
      habit.id === habitId 
        ? { 
            ...habit, 
            completedToday: !habit.completedToday,
            streak: habit.completedToday ? Math.max(0, habit.streak - 1) : habit.streak + 1
          }
        : habit
    ));
  };

  // دوال البومودورو
  const togglePomodoro = () => {
    setPomodoroTimer(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };

  const resetPomodoro = () => {
    setPomodoroTimer(prev => ({
      ...prev,
      isActive: false,
      timeLeft: prev.duration,
      isBreak: false
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // حساب الإحصائيات
  const todayTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0];
    return task.createdAt.split('T')[0] === today;
  });
  
  const completedTasks = tasks.filter(task => task.completed);
  const productivityScore = Math.round((completedTasks.length / Math.max(tasks.length, 1)) * 100);
  const activeHabits = habits.filter(habit => habit.completedToday);

  // ألوان الأولوية
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // أيقونات الفئات
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work': return <Briefcase className="h-4 w-4" />;
      case 'personal': return <Heart className="h-4 w-4" />;
      case 'study': return <BookOpen className="h-4 w-4" />;
      case 'health': return <Dumbbell className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🕐 إدارة وقتي</h1>
        <p className="text-gray-600">نظم وقتك واحقق أهدافك بكفاءة</p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">المهام اليوم</p>
                <p className="text-2xl font-bold">{todayTasks.length}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">معدل الإنجاز</p>
                <p className="text-2xl font-bold">{productivityScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">العادات النشطة</p>
                <p className="text-2xl font-bold">{activeHabits.length}</p>
              </div>
              <Star className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">جلسات بومودورو</p>
                <p className="text-2xl font-bold">{pomodoroTimer.sessionsCompleted}</p>
              </div>
              <Timer className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">لوحة التحكم</TabsTrigger>
          <TabsTrigger value="tasks">المهام</TabsTrigger>
          <TabsTrigger value="habits">العادات</TabsTrigger>
          <TabsTrigger value="pomodoro">بومودورو</TabsTrigger>
        </TabsList>

        {/* لوحة التحكم */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* المهام القادمة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  المهام القادمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTask(task.id)}
                        className="p-0 h-auto"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getCategoryIcon(task.category)}
                          <Badge className={getPriorityColor(task.priority)} variant="outline">
                            {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* العادات اليومية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  العادات اليومية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {habits.slice(0, 3).map(habit => (
                    <div key={habit.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl">{habit.icon}</div>
                      <div className="flex-1">
                        <p className="font-medium">{habit.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-gray-600">{habit.streak} يوم</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => toggleHabit(habit.id)}
                        variant={habit.completedToday ? "default" : "outline"}
                        size="sm"
                      >
                        {habit.completedToday ? 'مكتمل ✓' : 'إكمال'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* مؤقت البومودورو المدمج */}
          <Card className="bg-gradient-to-r from-red-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                مؤقت البومودورو
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl font-bold text-red-600 mb-4">
                  {formatTime(pomodoroTimer.timeLeft)}
                </div>
                <p className="text-lg text-gray-600 mb-4">
                  {pomodoroTimer.isBreak ? 'وقت الراحة' : 'وقت العمل'}
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={togglePomodoro}
                    size="lg"
                    className={pomodoroTimer.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                  >
                    {pomodoroTimer.isActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        إيقاف
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المهام */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">إدارة المهام</h2>
            <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة مهمة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة مهمة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="عنوان المهمة"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <Textarea
                    placeholder="وصف المهمة (اختياري)"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <Select
                    value={newTask.category}
                    onValueChange={(value: any) => setNewTask(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">عمل</SelectItem>
                      <SelectItem value="personal">شخصي</SelectItem>
                      <SelectItem value="study">دراسة</SelectItem>
                      <SelectItem value="health">صحة</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="low">منخفضة</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={addTask}>
                      إضافة
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {tasks.map(task => (
              <Card key={task.id} className={task.completed ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTask(task.id)}
                      className="p-0 h-auto mt-1"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {getCategoryIcon(task.category)}
                        <Badge className={getPriorityColor(task.priority)} variant="outline">
                          {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </Badge>
                        {task.dueDate && (
                          <Badge variant="outline">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString('ar-SA')}
                          </Badge>
                        )}
                        {task.estimatedTime && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.estimatedTime} دقيقة
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* تبويب العادات */}
        <TabsContent value="habits" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">تتبع العادات</h2>
            <Dialog open={showHabitDialog} onOpenChange={setShowHabitDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة عادة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة عادة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="اسم العادة"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="الأيقونة (إيموجي)"
                      value={newHabit.icon}
                      onChange={(e) => setNewHabit(prev => ({ ...prev, icon: e.target.value }))}
                    />
                    <Input
                      type="color"
                      value={newHabit.color}
                      onChange={(e) => setNewHabit(prev => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                  <Select
                    value={newHabit.category}
                    onValueChange={(value: any) => setNewHabit(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health">صحة</SelectItem>
                      <SelectItem value="learning">تعلم</SelectItem>
                      <SelectItem value="productivity">إنتاجية</SelectItem>
                      <SelectItem value="personal">شخصي</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder="الهدف"
                      value={newHabit.target}
                      onChange={(e) => setNewHabit(prev => ({ ...prev, target: parseInt(e.target.value) || 1 }))}
                    />
                    <Input
                      placeholder="الوحدة"
                      value={newHabit.unit}
                      onChange={(e) => setNewHabit(prev => ({ ...prev, unit: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowHabitDialog(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={addHabit}>
                      إضافة
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map(habit => (
              <Card key={habit.id} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 w-full h-1"
                  style={{ backgroundColor: habit.color }}
                />
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-3">{habit.icon}</div>
                    <h3 className="font-semibold text-lg mb-2">{habit.name}</h3>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{habit.streak} يوم متتالي</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      الهدف: {habit.target} {habit.unit} {habit.frequency === 'daily' ? 'يومياً' : 'أسبوعياً'}
                    </p>
                    <Button
                      onClick={() => toggleHabit(habit.id)}
                      className="w-full"
                      variant={habit.completedToday ? "default" : "outline"}
                      style={{
                        backgroundColor: habit.completedToday ? habit.color : 'transparent',
                        borderColor: habit.color,
                        color: habit.completedToday ? 'white' : habit.color
                      }}
                    >
                      {habit.completedToday ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          مكتمل اليوم
                        </>
                      ) : (
                        <>
                          <Circle className="h-4 w-4 mr-2" />
                          وضع علامة
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* تبويب البومودورو */}
        <TabsContent value="pomodoro" className="space-y-6">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">🍅 تقنية البومودورو</CardTitle>
              <p className="text-gray-600">25 دقيقة تركيز + 5 دقائق راحة</p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-8">
                <div className="text-8xl font-bold text-red-600 mb-4">
                  {formatTime(pomodoroTimer.timeLeft)}
                </div>
                <p className="text-xl text-gray-600 mb-2">
                  {pomodoroTimer.isBreak ? '☕ وقت الراحة' : '💪 وقت العمل'}
                </p>
                <Progress 
                  value={((pomodoroTimer.duration - pomodoroTimer.timeLeft) / pomodoroTimer.duration) * 100}
                  className="h-2 mb-4"
                />
              </div>

              <div className="flex justify-center gap-4 mb-8">
                <Button
                  onClick={togglePomodoro}
                  size="lg"
                  className={`px-8 ${pomodoroTimer.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  {pomodoroTimer.isActive ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      إيقاف
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      بدء
                    </>
                  )}
                </Button>
                <Button onClick={resetPomodoro} variant="outline" size="lg" className="px-8">
                  <RotateCcw className="h-5 w-5 mr-2" />
                  إعادة تعيين
                </Button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{pomodoroTimer.sessionsCompleted}</p>
                    <p className="text-sm text-gray-600">جلسة مكتملة</p>
                  </div>
                  <div>
                    <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{Math.round(pomodoroTimer.sessionsCompleted * 25 / 60 * 10) / 10}</p>
                    <p className="text-sm text-gray-600">ساعة عمل</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewTimeManagementPage;