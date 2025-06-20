
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
  Award,
  Brain,
  Sparkles,
  Lightbulb,
  Rocket,
  Coffee,
  Home,
  BookOpen,
  Heart,
  Sun,
  Moon,
  Mic,
  Camera,
  Music,
  MapPin,
  Wifi,
  Battery,
  Shield,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Download,
  Upload,
  RefreshCw
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
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

// Enhanced Types with AI features
interface SmartTask {
  id: string;
  title: string;
  description?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  dueDate?: string;
  completed: boolean;
  estimatedTime?: number;
  actualTime?: number;
  difficulty: number; // 1-10 scale
  energyRequired: 'high' | 'medium' | 'low';
  aiSuggestions?: string[];
  subtasks?: SmartTask[];
  tags: string[];
  mood?: 'motivated' | 'tired' | 'focused' | 'creative';
  location?: string;
  aiOptimalTime?: string;
}

interface SmartHabit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  target: number;
  completedToday: boolean;
  category: string;
  difficulty: number;
  aiInsights?: string[];
  bestTimeSlots?: string[];
  environmentalFactors?: string[];
  motivationalQuotes?: string[];
}

interface AIInsight {
  id: string;
  type: 'productivity' | 'wellness' | 'optimization' | 'warning';
  title: string;
  description: string;
  actionSuggestion: string;
  confidence: number;
  timestamp: Date;
}

interface FocusSession {
  id: string;
  duration: number;
  type: 'deep_work' | 'creative' | 'learning' | 'planning';
  mood: string;
  environment: string;
  productivity: number;
  timestamp: Date;
}

const TimeManagementPage: React.FC = () => {
  const { toast } = useToast();
  const [currentMood, setCurrentMood] = useState<'motivated' | 'tired' | 'focused' | 'creative'>('focused');
  const [currentEnergy, setCurrentEnergy] = useState<number>(75);
  const [isAIMode, setIsAIMode] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [ambientSounds, setAmbientSounds] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Enhanced State Management
  const [smartTasks, setSmartTasks] = useState<SmartTask[]>([]);
  const [smartHabits, setSmartHabits] = useState<SmartHabit[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [activeView, setActiveView] = useState('dashboard');
  
  // Pomodoro with AI enhancement
  const [pomodoroSession, setPomodoroSession] = useState({
    duration: 25 * 60,
    breaks: 5 * 60,
    completedSessions: 0,
    isActive: false,
    timeLeft: 25 * 60,
    isBreak: false,
    aiOptimized: true,
    adaptiveTiming: true,
    backgroundMusic: 'nature',
    focusLevel: 8
  });

  // AI-powered suggestions
  const [aiSuggestions, setAiSuggestions] = useState({
    morningRoutine: [],
    workOptimization: [],
    wellnessTips: [],
    productivityHacks: []
  });

  // Initialize with enhanced sample data
  useEffect(() => {
    initializeEnhancedData();
    generateAIInsights();
    optimizeSchedule();
  }, []);

  const initializeEnhancedData = () => {
    const sampleSmartTasks: SmartTask[] = [
      {
        id: '1',
        title: 'مراجعة شاملة لاختبار القياس',
        description: 'التركيز على الأسئلة الكمية والحلول المتقدمة',
        priority: 'urgent',
        category: 'دراسة',
        dueDate: '2025-06-21T14:00:00',
        completed: false,
        estimatedTime: 120,
        difficulty: 8,
        energyRequired: 'high',
        aiSuggestions: [
          'ابدأ بالمراجعة في الصباح الباكر للحصول على أقصى تركيز',
          'قسم المراجعة إلى جلسات 25 دقيقة مع استراحات',
          'استخدم تقنية فاينمان للشرح الذاتي'
        ],
        tags: ['قياس', 'دراسة', 'مهم'],
        mood: 'focused',
        aiOptimalTime: '08:00-10:00'
      },
      {
        id: '2',
        title: 'تمارين يوجا صباحية',
        priority: 'medium',
        category: 'صحة',
        completed: false,
        estimatedTime: 30,
        difficulty: 3,
        energyRequired: 'low',
        aiSuggestions: [
          'ممارسة اليوجا تحسن التركيز لبقية اليوم',
          'اختر تمارين الإطالة للتخلص من توتر الدراسة'
        ],
        tags: ['صحة', 'روتين صباحي'],
        mood: 'motivated',
        aiOptimalTime: '06:30-07:00'
      },
      {
        id: '3',
        title: 'قراءة كتاب التطوير الذاتي',
        priority: 'low',
        category: 'تطوير شخصي',
        completed: false,
        estimatedTime: 45,
        difficulty: 4,
        energyRequired: 'medium',
        aiSuggestions: [
          'اقرأ في المساء للاسترخاء',
          'اكتب ملاحظات عن الأفكار المهمة'
        ],
        tags: ['قراءة', 'تطوير'],
        mood: 'creative',
        aiOptimalTime: '20:00-21:00'
      }
    ];

    const sampleSmartHabits: SmartHabit[] = [
      {
        id: '1',
        name: 'شرب 8 أكواب ماء يومياً',
        frequency: 'daily',
        streak: 12,
        target: 8,
        completedToday: false,
        category: 'صحة',
        difficulty: 2,
        aiInsights: [
          'الترطيب المناسب يحسن التركيز بنسبة 23%',
          'اشرب كوباً عند الاستيقاظ لتنشيط الأيض'
        ],
        bestTimeSlots: ['07:00', '10:00', '13:00', '16:00'],
        motivationalQuotes: [
          'الماء هو سر الحياة والطاقة',
          'جسم مرطب = عقل نشط'
        ]
      },
      {
        id: '2',
        name: 'قراءة 30 دقيقة يومياً',
        frequency: 'daily',
        streak: 15,
        target: 30,
        completedToday: true,
        category: 'تطوير',
        difficulty: 5,
        aiInsights: [
          'القراءة اليومية تزيد المفردات وتحسن الفهم',
          'اختر كتباً متنوعة لتوسيع الآفاق'
        ],
        bestTimeSlots: ['20:00', '21:00'],
        motivationalQuotes: [
          'القراءة غذاء العقل',
          'كل كتاب نافذة على عالم جديد'
        ]
      }
    ];

    setSmartTasks(sampleSmartTasks);
    setSmartHabits(sampleSmartHabits);
  };

  const generateAIInsights = () => {
    const insights: AIInsight[] = [
      {
        id: '1',
        type: 'productivity',
        title: 'ذروة الإنتاجية الصباحية',
        description: 'تحليل بياناتك يظهر أن إنتاجيتك أعلى بـ 40% في الفترة من 8-10 صباحاً',
        actionSuggestion: 'جدول المهام الصعبة في هذا الوقت',
        confidence: 89,
        timestamp: new Date()
      },
      {
        id: '2',
        type: 'wellness',
        title: 'انخفاض مستوى الطاقة',
        description: 'لاحظت انخفاضاً في مستوى طاقتك بعد الغداء',
        actionSuggestion: 'جرب المشي لمدة 10 دقائق أو تمارين التنفس',
        confidence: 76,
        timestamp: new Date()
      },
      {
        id: '3',
        type: 'optimization',
        title: 'تحسين روتين النوم',
        description: 'نومك المبكر بساعة واحدة قد يزيد إنتاجيتك الصباحية',
        actionSuggestion: 'اضبط تذكيراً للنوم في الساعة 10:30 مساءً',
        confidence: 82,
        timestamp: new Date()
      }
    ];
    setAiInsights(insights);
  };

  const optimizeSchedule = () => {
    // AI-powered schedule optimization
    toast({
      title: "تم تحسين جدولك! 🤖",
      description: "الذكاء الاصطناعي رتب مهامك حسب طاقتك ووقت ذروة إنتاجيتك",
    });
  };

  // Enhanced Pomodoro with AI
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
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [pomodoroSession.isActive, pomodoroSession.timeLeft]);

  const handleSessionComplete = () => {
    setPomodoroSession(prev => ({
      ...prev,
      isActive: false,
      isBreak: !prev.isBreak,
      timeLeft: prev.isBreak ? prev.duration : prev.breaks,
      completedSessions: prev.isBreak ? prev.completedSessions + 1 : prev.completedSessions
    }));

    // Record focus session
    const newSession: FocusSession = {
      id: Date.now().toString(),
      duration: pomodoroSession.isBreak ? 5 : 25,
      type: 'deep_work',
      mood: currentMood,
      environment: 'quiet',
      productivity: pomodoroSession.focusLevel,
      timestamp: new Date()
    };
    setFocusSessions(prev => [...prev, newSession]);

    if (pomodoroSession.isBreak) {
      toast({
        title: "انتهت فترة العمل! 🎯",
        description: "حان وقت الاستراحة. تحرك قليلاً أو مارس تمارين العين",
      });
    } else {
      toast({
        title: "انتهت الاستراحة! ⚡",
        description: "العودة للعمل! الذكاء الاصطناعي يقترح البدء بالمهمة التالية",
      });
    }
  };

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

  const toggleSmartTask = (taskId: string) => {
    setSmartTasks(tasks => 
      tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
    
    if (!smartTasks.find(t => t.id === taskId)?.completed) {
      toast({
        title: "مهمة مكتملة! 🎉",
        description: "رائع! الذكاء الاصطناعي يقترح مكافأة قصيرة",
      });
    }
  };

  const toggleSmartHabit = (habitId: string) => {
    setSmartHabits(habits => 
      habits.map(habit => 
        habit.id === habitId ? { 
          ...habit, 
          completedToday: !habit.completedToday,
          streak: !habit.completedToday ? habit.streak + 1 : Math.max(0, habit.streak - 1)
        } : habit
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'productivity': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'wellness': return <Heart className="w-5 h-5 text-green-500" />;
      case 'optimization': return <Zap className="w-5 h-5 text-purple-500" />;
      case 'warning': return <Flag className="w-5 h-5 text-red-500" />;
      default: return <Lightbulb className="w-5 h-5 text-yellow-500" />;
    }
  };

  const completedTasks = smartTasks.filter(task => task.completed).length;
  const totalTasks = smartTasks.length;
  const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const weeklyGoalProgress = Math.min(100, (pomodoroSession.completedSessions / 28) * 100);

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Enhanced Header with AI Status */}
      <div className="text-center mb-8 relative">
        <div className="absolute top-0 right-0 flex items-center gap-2">
          <Badge variant={isAIMode ? "default" : "secondary"} className="gap-2">
            <Brain className="w-4 h-4" />
            {isAIMode ? "AI نشط" : "AI متوقف"}
          </Badge>
          <Switch checked={isAIMode} onCheckedChange={setIsAIMode} />
        </div>
        
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            وقتي الذكي
          </h1>
        </div>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          منصة إدارة الوقت المدعومة بالذكاء الاصطناعي - نظم حياتك بذكاء واحقق أهدافك بكفاءة
        </p>
        
        {/* Current Status Bar */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span className="text-sm">الطاقة: {currentEnergy}%</span>
            <Progress value={currentEnergy} className="w-20 h-2" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{currentMood === 'focused' ? 'مركز' : currentMood === 'creative' ? 'مبدع' : currentMood === 'motivated' ? 'متحفز' : 'متعب'}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-blue-500" />
            <span className="text-sm">{pomodoroSession.completedSessions} جلسة اليوم</span>
          </div>
        </div>
      </div>

      {/* AI Quick Actions Bar */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Rocket className="w-6 h-6" />
              <div>
                <h3 className="font-bold">إجراءات ذكية سريعة</h3>
                <p className="text-sm opacity-90">اختر إجراء مقترح من الذكاء الاصطناعي</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" size="sm" className="gap-2">
                <Brain className="w-4 h-4" />
                تحسين الجدول
              </Button>
              <Button variant="secondary" size="sm" className="gap-2">
                <Target className="w-4 h-4" />
                هدف سريع
              </Button>
              <Button variant="secondary" size="sm" className="gap-2">
                <Coffee className="w-4 h-4" />
                استراحة ذكية
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Dashboard with AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإنتاجية اليوم</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{productivityScore}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks}/{totalTasks} مهمة مكتملة
            </p>
            <Progress value={productivityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">جلسات التركيز</CardTitle>
            <Timer className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{pomodoroSession.completedSessions}</div>
            <p className="text-xs text-muted-foreground">
              {pomodoroSession.completedSessions * 25} دقيقة تركيز
            </p>
            <Progress value={(pomodoroSession.completedSessions / 12) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العادات النشطة</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {smartHabits.filter(h => h.completedToday).length}/{smartHabits.length}
            </div>
            <p className="text-xs text-muted-foreground">
              عادات مكتملة اليوم
            </p>
            <Progress 
              value={(smartHabits.filter(h => h.completedToday).length / smartHabits.length) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نقاط الذكاء</CardTitle>
            <Award className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {productivityScore * 10 + pomodoroSession.completedSessions * 50}
            </div>
            <p className="text-xs text-muted-foreground">
              نقطة من 2000
            </p>
            <Progress value={((productivityScore * 10 + pomodoroSession.completedSessions * 50) / 2000) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs with AI Features */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <TabsTrigger value="dashboard" className="gap-2">
            <Home className="w-4 h-4" />
            الرئيسية
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            المهام الذكية
          </TabsTrigger>
          <TabsTrigger value="habits" className="gap-2">
            <Target className="w-4 h-4" />
            العادات
          </TabsTrigger>
          <TabsTrigger value="pomodoro" className="gap-2">
            <Timer className="w-4 h-4" />
            بومودورو AI
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Brain className="w-4 h-4" />
            رؤى ذكية
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Smart Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  نظرة ذكية على اليوم
                </CardTitle>
                <CardDescription>
                  تحليل مدعوم بالذكاء الاصطناعي لنشاطك اليومي
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">تقدم المهام</span>
                      <span className="text-sm text-blue-600">{productivityScore}%</span>
                    </div>
                    <Progress value={productivityScore} className="h-2" />
                    <p className="text-xs text-gray-600 mt-1">أداء ممتاز! استمر</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">الهدف الأسبوعي</span>
                      <span className="text-sm text-purple-600">{Math.round(weeklyGoalProgress)}%</span>
                    </div>
                    <Progress value={weeklyGoalProgress} className="h-2" />
                    <p className="text-xs text-gray-600 mt-1">متقدم بشكل رائع</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-500" />
                    المهام العاجلة (مرتبة بالذكاء الاصطناعي)
                  </h4>
                  {smartTasks
                    .filter(task => task.priority === 'urgent' && !task.completed)
                    .slice(0, 3)
                    .map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <Flag className="h-4 w-4 text-red-600" />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{task.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {task.aiOptimalTime}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              طاقة {task.energyRequired === 'high' ? 'عالية' : task.energyRequired === 'medium' ? 'متوسطة' : 'منخفضة'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  المساعد الذكي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">اقتراح ذكي</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    بناءً على نشاطك، أنصحك بأخذ استراحة 10 دقائق قبل البدء في المهمة التالية
                  </p>
                  <Button size="sm" className="mt-2 w-full">
                    تطبيق الاقتراح
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">اختصارات سريعة</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="w-3 h-3" />
                      مهمة
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Play className="w-3 h-3" />
                      تركيز
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Coffee className="w-3 h-3" />
                      استراحة
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <BarChart3 className="w-3 h-3" />
                      تقرير
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Smart Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">المهام الذكية</h2>
              <p className="text-gray-600 dark:text-gray-400">
                مهام محسّنة بالذكاء الاصطناعي حسب طاقتك ووقتك المثالي
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  مهمة ذكية جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>إنشاء مهمة ذكية</DialogTitle>
                  <DialogDescription>
                    الذكاء الاصطناعي سيحلل مهمتك ويقترح أفضل أوقات للتنفيذ
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="task-title">عنوان المهمة</Label>
                      <Input id="task-title" placeholder="مثال: مراجعة درس الرياضيات" />
                    </div>
                    <div>
                      <Label htmlFor="priority">الأولوية</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الأولوية" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">عاجل</SelectItem>
                          <SelectItem value="high">عالية</SelectItem>
                          <SelectItem value="medium">متوسطة</SelectItem>
                          <SelectItem value="low">منخفضة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="task-desc">الوصف</Label>
                    <Textarea id="task-desc" placeholder="تفاصيل المهمة..." />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="difficulty">صعوبة (1-10)</Label>
                      <Slider defaultValue={[5]} max={10} step={1} />
                    </div>
                    <div>
                      <Label htmlFor="energy">طاقة مطلوبة</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مستوى الطاقة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">عالية</SelectItem>
                          <SelectItem value="medium">متوسطة</SelectItem>
                          <SelectItem value="low">منخفضة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="mood">المزاج المطلوب</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المزاج" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="focused">مركز</SelectItem>
                          <SelectItem value="creative">مبدع</SelectItem>
                          <SelectItem value="motivated">متحفز</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button className="gap-2">
                    <Brain className="w-4 h-4" />
                    إنشاء بذكاء اصطناعي
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {smartTasks.map(task => (
              <Card key={task.id} className={`transition-all hover:shadow-lg ${
                task.completed ? 'opacity-75 bg-green-50 dark:bg-green-950/20' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => toggleSmartTask(task.id)}
                        className="mt-1 transition-all hover:scale-110"
                      >
                        {task.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-medium ${
                            task.completed ? 'line-through text-gray-500' : ''
                          }`}>
                            {task.title}
                          </h3>
                          {isAIMode && task.aiOptimalTime && (
                            <Badge variant="secondary" className="gap-1">
                              <Brain className="w-3 h-3" />
                              {task.aiOptimalTime}
                            </Badge>
                          )}
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={getPriorityColor(task.priority)}>
                            <Flag className="w-3 h-3 mr-1" />
                            {task.priority === 'urgent' ? 'عاجل' : 
                             task.priority === 'high' ? 'عالية' : 
                             task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </Badge>
                          
                          <Badge variant="outline">{task.category}</Badge>
                          
                          {task.estimatedTime && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="w-3 h-3" />
                              {task.estimatedTime} د
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <span>صعوبة: {task.difficulty}/10</span>
                          </div>
                          
                          <Badge variant={task.energyRequired === 'high' ? 'destructive' : 
                                        task.energyRequired === 'medium' ? 'default' : 'secondary'}>
                            طاقة {task.energyRequired === 'high' ? 'عالية' : 
                                   task.energyRequired === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </Badge>
                        </div>
                        
                        {isAIMode && task.aiSuggestions && task.aiSuggestions.length > 0 && (
                          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Lightbulb className="w-3 h-3 text-blue-600" />
                              <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                اقتراحات الذكاء الاصطناعي:
                              </span>
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                              {task.aiSuggestions[0]}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Enhanced Pomodoro Tab */}
        <TabsContent value="pomodoro" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI-Enhanced Pomodoro Timer */}
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Timer className="h-5 w-5" />
                  بومودورو بالذكاء الاصطناعي
                </CardTitle>
                <CardDescription>
                  {pomodoroSession.isBreak ? 'وقت الراحة الذكية' : 'وقت التركيز العميق'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Circular Progress with AI Enhancement */}
                <div className="relative w-48 h-48 mx-auto">
                  <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${((pomodoroSession.duration - pomodoroSession.timeLeft) / pomodoroSession.duration) * 283} ${283 - ((pomodoroSession.duration - pomodoroSession.timeLeft) / pomodoroSession.duration) * 283}`}
                      className="transition-all duration-1000"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatTime(pomodoroSession.timeLeft)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        جلسة {pomodoroSession.completedSessions + 1}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {[...Array(pomodoroSession.focusLevel)].map((_, i) => (
                          <Star key={i} className="w-2 h-2 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={togglePomodoro}
                    size="lg"
                    className={`gap-2 ${
                      pomodoroSession.isBreak 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    }`}
                  >
                    {pomodoroSession.isActive ? (
                      <>
                        <Pause className="w-5 h-5" />
                        إيقاف مؤقت
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        {pomodoroSession.isBreak ? 'استراحة ذكية' : 'تركيز عميق'}
                      </>
                    )}
                  </Button>
                  
                  <Button onClick={resetPomodoro} variant="outline" size="lg" className="gap-2">
                    <RotateCcw className="w-5 h-5" />
                    إعادة تعيين
                  </Button>
                </div>

                {/* AI Enhancement Settings */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      <span className="text-sm">الأصوات المحيطة</span>
                    </div>
                    <Switch checked={ambientSounds} onCheckedChange={setAmbientSounds} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      <span className="text-sm">التحكم الصوتي</span>
                    </div>
                    <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">مستوى التركيز المطلوب</span>
                      <span className="text-sm font-medium">{pomodoroSession.focusLevel}/10</span>
                    </div>
                    <Slider 
                      value={[pomodoroSession.focusLevel]} 
                      onValueChange={(value) => setPomodoroSession(prev => ({...prev, focusLevel: value[0]}))}
                      max={10} 
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Session Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  تحليلات الجلسة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{pomodoroSession.completedSessions}</div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">جلسات مكتملة</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{pomodoroSession.completedSessions * 25}</div>
                    <div className="text-sm text-green-800 dark:text-green-300">دقائق تركيز</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.floor(pomodoroSession.completedSessions / 4)}
                    </div>
                    <div className="text-sm text-purple-800 dark:text-purple-300">دورات كاملة</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">85%</div>
                    <div className="text-sm text-orange-800 dark:text-orange-300">كفاءة التركيز</div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    توصيات الذكاء الاصطناعي
                  </h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Lightbulb className="w-3 h-3 text-yellow-600" />
                        <span className="text-sm font-medium">تحسين الأداء</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        جرب زيادة مدة الجلسة إلى 30 دقيقة - مستوى تركيزك يسمح بذلك
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Heart className="w-3 h-3 text-green-600" />
                        <span className="text-sm font-medium">صحة أفضل</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        خذ استراحة للحركة كل 3 جلسات لتحسين الدورة الدموية
                      </p>
                    </div>
                  </div>
                </div>

                {/* Focus Mood Selector */}
                <div className="space-y-3">
                  <h4 className="font-medium">حالة التركيز الحالية</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'focused', label: 'مركز', icon: Target, color: 'blue' },
                      { id: 'creative', label: 'مبدع', icon: Sparkles, color: 'purple' },
                      { id: 'motivated', label: 'متحفز', icon: Rocket, color: 'green' },
                      { id: 'tired', label: 'متعب', icon: Coffee, color: 'orange' }
                    ].map(mood => (
                      <Button
                        key={mood.id}
                        variant={currentMood === mood.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentMood(mood.id as any)}
                        className="gap-2"
                      >
                        <mood.icon className="w-3 h-3" />
                        {mood.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">الرؤى الذكية</h2>
            <p className="text-gray-600 dark:text-gray-400">
              تحليلات مدعومة بالذكاء الاصطناعي لتحسين إنتاجيتك
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiInsights.map(insight => (
              <Card key={insight.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getInsightIcon(insight.type)}
                    {insight.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={insight.type === 'warning' ? 'destructive' : 
                                  insight.type === 'wellness' ? 'default' : 'secondary'}>
                      {insight.type === 'productivity' ? 'إنتاجية' :
                       insight.type === 'wellness' ? 'صحة' :
                       insight.type === 'optimization' ? 'تحسين' : 'تحذير'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-gray-500">{insight.confidence}% ثقة</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {insight.description}
                  </p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        اقتراح العمل:
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      {insight.actionSuggestion}
                    </p>
                  </div>
                  <Button size="sm" className="mt-3 w-full">
                    تطبيق الاقتراح
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weekly Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                أداء الأسبوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { day: 'السبت', productivity: 85, tasks: 6, focus: 4 },
                  { day: 'الأحد', productivity: 92, tasks: 8, focus: 5 },
                  { day: 'الاثنين', productivity: 78, tasks: 5, focus: 3 },
                  { day: 'الثلاثاء', productivity: 88, tasks: 7, focus: 4 },
                  { day: 'الأربعاء', productivity: 95, tasks: 9, focus: 6 },
                  { day: 'الخميس', productivity: 82, tasks: 6, focus: 4 },
                  { day: 'الجمعة', productivity: 70, tasks: 4, focus: 2 }
                ].map((day, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium">{day.day}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>الإنتاجية</span>
                        <span>{day.productivity}%</span>
                      </div>
                      <Progress value={day.productivity} className="h-2" />
                    </div>
                    <div className="text-xs text-gray-500">
                      {day.tasks} مهام • {day.focus} جلسات
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">إعدادات متقدمة</h2>
            <p className="text-gray-600 dark:text-gray-400">
              خصص تجربتك الذكية حسب احتياجاتك
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  إعدادات الذكاء الاصطناعي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ai-mode">تفعيل الذكاء الاصطناعي</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      الحصول على اقتراحات ذكية وتحسينات تلقائية
                    </p>
                  </div>
                  <Switch id="ai-mode" checked={isAIMode} onCheckedChange={setIsAIMode} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="voice-control">التحكم الصوتي</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      إدارة المهام والمؤقت بالأوامر الصوتية
                    </p>
                  </div>
                  <Switch id="voice-control" checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ambient-sounds">الأصوات المحيطة</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      أصوات طبيعية لتحسين التركيز
                    </p>
                  </div>
                  <Switch id="ambient-sounds" checked={ambientSounds} onCheckedChange={setAmbientSounds} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  إعدادات شخصية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="energy-level">مستوى الطاقة الحالي</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="energy-level"
                      value={[currentEnergy]}
                      onValueChange={(value) => setCurrentEnergy(value[0])}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <Badge variant="outline">{currentEnergy}%</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>المزاج الحالي</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'focused', label: 'مركز', icon: Target },
                      { id: 'creative', label: 'مبدع', icon: Sparkles },
                      { id: 'motivated', label: 'متحفز', icon: Rocket },
                      { id: 'tired', label: 'متعب', icon: Coffee }
                    ].map(mood => (
                      <Button
                        key={mood.id}
                        variant={currentMood === mood.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentMood(mood.id as any)}
                        className="gap-2"
                      >
                        <mood.icon className="w-3 h-3" />
                        {mood.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  النسخ الاحتياطي والمزامنة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    تصدير البيانات
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    استيراد البيانات
                  </Button>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">المزامنة السحابية</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    احفظ بياناتك في السحابة وزامنها عبر جميع أجهزتك
                  </p>
                  <Button size="sm" className="w-full">
                    تفعيل المزامنة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Smart Habits Tab */}
        <TabsContent value="habits" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">العادات الذكية</h2>
              <p className="text-gray-600 dark:text-gray-400">
                عادات محسّنة بالذكاء الاصطناعي مع اقتراحات شخصية
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  عادة ذكية جديدة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إنشاء عادة ذكية</DialogTitle>
                  <DialogDescription>
                    الذكاء الاصطناعي سيساعدك في تكوين عادة مستدامة
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="habit-name">اسم العادة</Label>
                    <Input id="habit-name" placeholder="مثال: قراءة 20 صفحة يومياً" />
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
                          <SelectItem value="monthly">شهري</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="difficulty">الصعوبة (1-10)</Label>
                      <Slider defaultValue={[3]} max={10} step={1} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button className="gap-2">
                    <Brain className="w-4 h-4" />
                    إنشاء بالذكاء الاصطناعي
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {smartHabits.map(habit => (
              <Card key={habit.id} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-green-400 to-green-600" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{habit.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-bold">{habit.streak}</span>
                    </div>
                  </div>
                  <CardDescription>
                    {habit.frequency === 'daily' ? 'يومي' : 
                     habit.frequency === 'weekly' ? 'أسبوعي' : 'شهري'} • 
                    صعوبة {habit.difficulty}/10
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">التقدم اليوم</span>
                    <div className="flex items-center gap-2">
                      <Progress value={habit.completedToday ? 100 : 0} className="w-20 h-2" />
                      <Star className={`h-4 w-4 ${habit.completedToday ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                    </div>
                  </div>
                  
                  {isAIMode && habit.aiInsights && habit.aiInsights.length > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                          رؤية ذكية:
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        {habit.aiInsights[0]}
                      </p>
                    </div>
                  )}
                  
                  {habit.bestTimeSlots && habit.bestTimeSlots.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        أفضل أوقات:
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        {habit.bestTimeSlots.slice(0, 3).map((time, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => toggleSmartHabit(habit.id)}
                    variant={habit.completedToday ? "default" : "outline"}
                    className="w-full gap-2"
                    size="sm"
                  >
                    {habit.completedToday ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        مكتمل اليوم ✓
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        وضع علامة كمكتمل
                      </>
                    )}
                  </Button>
                  
                  {habit.motivationalQuotes && habit.motivationalQuotes.length > 0 && (
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <p className="text-xs italic text-yellow-800 dark:text-yellow-300 text-center">
                        "{habit.motivationalQuotes[0]}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeManagementPage;
