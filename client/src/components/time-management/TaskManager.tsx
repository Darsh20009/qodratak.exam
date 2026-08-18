
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Clock, 
  Calendar, 
  Flag, 
  CheckCircle2, 
  Circle, 
  Trash2,
  Brain,
  Lightbulb,
  Star,
  Zap,
  Target,
  Timer,
  Heart,
  Sparkles,
  TrendingUp,
  BarChart3,
  Eye,
  EyeOff,
  Filter,
  SortAsc,
  Search,
  MapPin,
  User,
  Coffee
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const taskSchema = z.object({
  title: z.string().min(1, "عنوان المهمة مطلوب"),
  description: z.string().optional(),
  priority: z.enum(["urgent", "high", "medium", "low"]),
  category: z.enum(["work", "personal", "study", "fitness", "health", "family"]),
  dueDate: z.string().optional(),
  estimatedTime: z.number().optional(),
  difficulty: z.number().min(1).max(10),
  energyRequired: z.enum(["high", "medium", "low"]),
  mood: z.enum(["focused", "creative", "motivated", "tired"]).optional(),
  location: z.string().optional(),
  projectId: z.number().optional(),
});

interface SmartTask {
  id: number;
  title: string;
  description?: string;
  priority: "urgent" | "high" | "medium" | "low";
  category: string;
  dueDate?: string;
  completed: boolean;
  estimatedTime?: number;
  actualTime?: number;
  difficulty: number;
  energyRequired: "high" | "medium" | "low";
  mood?: "focused" | "creative" | "motivated" | "tired";
  location?: string;
  aiSuggestions?: string[];
  aiOptimalTime?: string;
  status: "pending" | "in_progress" | "completed" | "paused";
  tags: string[];
  subtasks?: SmartTask[];
  completedAt?: string;
  focusScore?: number;
}

interface TaskManagerProps {
  userId: number;
  tasks: SmartTask[];
  projects: any[];
}

export const TaskManager = ({ userId, tasks, projects }: TaskManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("priority");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "calendar">("list");
  const [showAIFeatures, setShowAIFeatures] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "personal",
      dueDate: "",
      estimatedTime: 30,
      difficulty: 5,
      energyRequired: "medium",
      mood: "focused",
      location: "",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => {
      // Generate AI suggestions based on task data
      const aiSuggestions = generateAISuggestions(data);
      const aiOptimalTime = calculateOptimalTime(data);
      
      return apiRequest(`/api/tasks`, "POST", { 
        ...data, 
        userId,
        status: "pending",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        aiSuggestions,
        aiOptimalTime,
        focusScore: calculateFocusScore(data),
        tags: extractTags(data.title + " " + (data.description || ""))
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "تم إنشاء المهمة الذكية! 🤖",
        description: "تم تحليل مهمتك وإضافة اقتراحات ذكية لتحسين الأداء",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/tasks/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId] });
      toast({
        title: "تم تحديث المهمة ✨",
        description: "تم تحديث المهمة مع تحسينات ذكية جديدة",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/tasks/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId] });
      toast({
        title: "تم حذف المهمة",
        description: "تم حذف المهمة بنجاح",
      });
    },
  });

  // AI Helper Functions
  const generateAISuggestions = (taskData: any): string[] => {
    const suggestions = [];
    
    if (taskData.priority === "urgent") {
      suggestions.push("ابدأ بهذه المهمة في بداية اليوم عندما تكون طاقتك في أعلى مستوى");
    }
    
    if (taskData.difficulty >= 7) {
      suggestions.push("قسم هذه المهمة إلى مهام فرعية أصغر لتسهيل الإنجاز");
      suggestions.push("استخدم تقنية بومودورو مع فترات تركيز 25 دقيقة");
    }
    
    if (taskData.energyRequired === "high") {
      suggestions.push("أنجز هذه المهمة في الصباح الباكر أو بعد فترة راحة");
    }
    
    if (taskData.category === "study") {
      suggestions.push("اختر مكاناً هادئاً ومريحاً للدراسة");
      suggestions.push("راجع ما تعلمته بعد 24 ساعة لتعزيز الذاكرة");
    }
    
    if (taskData.estimatedTime > 60) {
      suggestions.push("خذ استراحة كل 45-60 دقيقة للحفاظ على التركيز");
    }
    
    return suggestions.slice(0, 3); // أفضل 3 اقتراحات
  };

  const calculateOptimalTime = (taskData: any): string => {
    const timeSlots = {
      high: ["08:00-10:00", "15:00-17:00"],
      medium: ["10:00-12:00", "14:00-16:00", "19:00-21:00"],
      low: ["12:00-14:00", "17:00-19:00", "21:00-22:00"]
    };
    
    const energySlots = timeSlots[taskData.energyRequired as keyof typeof timeSlots] || timeSlots.medium;
    return energySlots[Math.floor(Math.random() * energySlots.length)];
  };

  const calculateFocusScore = (taskData: any): number => {
    let score = 5; // Base score
    
    if (taskData.priority === "urgent") score += 2;
    if (taskData.difficulty >= 7) score += 1;
    if (taskData.energyRequired === "high") score += 1;
    if (taskData.mood === "focused") score += 1;
    
    return Math.min(10, score);
  };

  const extractTags = (text: string): string[] => {
    const commonTags = {
      "دراسة": ["تعلم", "مراجعة", "اختبار", "قراءة"],
      "عمل": ["مشروع", "اجتماع", "تقرير", "مهمة"],
      "صحة": ["رياضة", "تمرين", "طبيب", "دواء"],
      "شخصي": ["عائلة", "أصدقاء", "هواية", "راحة"]
    };
    
    const tags = [];
    for (const [tag, keywords] of Object.entries(commonTags)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag);
      }
    }
    
    return tags;
  };

  const onSubmit = (data: z.infer<typeof taskSchema>) => {
    createTaskMutation.mutate(data);
  };

  const toggleTaskStatus = (task: SmartTask) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    updateTaskMutation.mutate({ 
      id: task.id, 
      data: { 
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date() : null,
        actualTime: newStatus === "completed" ? task.estimatedTime : null
      }
    });
  };

  const startTask = (task: SmartTask) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: { status: "in_progress" }
    });
    
    toast({
      title: `بدأت العمل على: ${task.title}`,
      description: "النظام يتتبع تقدمك الآن",
    });
  };

  const pauseTask = (task: SmartTask) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: { status: "paused" }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600 bg-red-100 dark:bg-red-900/30 border-red-200";
      case "high": return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200";
      case "low": return "text-green-600 bg-green-100 dark:bg-green-900/30 border-green-200";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/30 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "in_progress": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "paused": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent": return "عاجل";
      case "high": return "عالية";
      case "medium": return "متوسطة";
      case "low": return "منخفضة";
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "مكتملة";
      case "in_progress": return "قيد التنفيذ";
      case "paused": return "متوقفة";
      case "pending": return "قيد الانتظار";
      default: return status;
    }
  };

  const getEnergyIcon = (energy: string) => {
    switch (energy) {
      case "high": return <Zap className="w-3 h-3 text-red-500" />;
      case "medium": return <Target className="w-3 h-3 text-yellow-500" />;
      case "low": return <Coffee className="w-3 h-3 text-green-500" />;
      default: return <Heart className="w-3 h-3 text-gray-500" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterCategory !== "all" && task.category !== filterCategory) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    if (!showCompleted && task.status === "completed") return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case "priority":
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      case "difficulty":
        return (b.difficulty || 0) - (a.difficulty || 0);
      case "dueDate":
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case "focusScore":
        return (b.focusScore || 0) - (a.focusScore || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-500" />
            إدارة المهام الذكية
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            مهام ذكية مع اقتراحات شخصية ومتابعة متطورة
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIFeatures(!showAIFeatures)}
            className="gap-2"
          >
            {showAIFeatures ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showAIFeatures ? "إخفاء الاقتراحات" : "إظهار الاقتراحات"}
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                مهمة ذكية جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  إنشاء مهمة ذكية
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان المهمة *</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل عنوان المهمة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوصف (اختياري)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="تفاصيل المهمة وملاحظات إضافية" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الأولوية</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="urgent">عاجل</SelectItem>
                              <SelectItem value="high">عالية</SelectItem>
                              <SelectItem value="medium">متوسطة</SelectItem>
                              <SelectItem value="low">منخفضة</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الفئة</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="personal">شخصي</SelectItem>
                              <SelectItem value="work">عمل</SelectItem>
                              <SelectItem value="study">دراسة</SelectItem>
                              <SelectItem value="fitness">لياقة</SelectItem>
                              <SelectItem value="health">صحة</SelectItem>
                              <SelectItem value="family">عائلة</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاريخ الاستحقاق (اختياري)</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الوقت المتوقع (دقائق)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              placeholder="30"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <h3 className="font-medium flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-500" />
                      معلومات إضافية
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>مستوى الصعوبة: {field.value}/10</FormLabel>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              max={10}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="energyRequired"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الطاقة المطلوبة</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="high">عالية</SelectItem>
                                <SelectItem value="medium">متوسطة</SelectItem>
                                <SelectItem value="low">منخفضة</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المزاج المطلوب</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="focused">مركز</SelectItem>
                                <SelectItem value="creative">مبدع</SelectItem>
                                <SelectItem value="motivated">متحفز</SelectItem>
                                <SelectItem value="tired">متعب</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المكان المفضل (اختياري)</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: المكتبة، المنزل، المقهى" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createTaskMutation.isPending}
                      className="flex-1 gap-2"
                    >
                      <Brain className="w-4 h-4" />
                      {createTaskMutation.isPending ? "جاري الإنشاء..." : "إنشاء مهمة ذكية"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="البحث في المهام..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="paused">متوقفة</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفئات</SelectItem>
                  <SelectItem value="personal">شخصي</SelectItem>
                  <SelectItem value="work">عمل</SelectItem>
                  <SelectItem value="study">دراسة</SelectItem>
                  <SelectItem value="fitness">لياقة</SelectItem>
                  <SelectItem value="health">صحة</SelectItem>
                  <SelectItem value="family">عائلة</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأولويات</SelectItem>
                  <SelectItem value="urgent">عاجل</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="ترتيب حسب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">الأولوية</SelectItem>
                  <SelectItem value="difficulty">الصعوبة</SelectItem>
                  <SelectItem value="dueDate">تاريخ الاستحقاق</SelectItem>
                  <SelectItem value="focusScore">نقاط التركيز</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch 
                  checked={showCompleted} 
                  onCheckedChange={setShowCompleted}
                  id="show-completed"
                />
                <label htmlFor="show-completed" className="text-sm">المكتملة</label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="grid gap-4">
        {sortedTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                لا توجد مهام
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                ابدأ بإضافة مهمة ذكية جديدة لتنظيم وقتك
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedTasks.map((task: SmartTask) => (
            <Card key={task.id} className={`transition-all hover:shadow-md border-l-4 ${
              task.status === "completed" ? "opacity-75 border-l-green-500 bg-green-50/30 dark:bg-green-950/10" : 
              task.status === "in_progress" ? "border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10" :
              task.status === "paused" ? "border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10" :
              task.priority === "urgent" ? "border-l-red-500" : "border-l-gray-300"
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="mt-1 transition-all hover:scale-110"
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-medium ${
                          task.status === "completed" ? 'line-through text-gray-500' : ''
                        }`}>
                          {task.title}
                        </h3>
                        
                        {showAIFeatures && task.aiOptimalTime && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Brain className="w-3 h-3" />
                            {task.aiOptimalTime}
                          </Badge>
                        )}
                        
                        {task.focusScore && task.focusScore >= 8 && (
                          <Badge variant="default" className="gap-1 text-xs bg-green-100 text-green-800">
                            <Star className="w-3 h-3" />
                            عالي التركيز
                          </Badge>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 flex-wrap mb-3">
                        <Badge className={getPriorityColor(task.priority)}>
                          <Flag className="w-3 h-3 mr-1" />
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        
                        <Badge variant="outline">{task.category}</Badge>
                        
                        {task.estimatedTime && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            {task.estimatedTime} د
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Target className="w-3 h-3" />
                          صعوبة {task.difficulty}/10
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          {getEnergyIcon(task.energyRequired)}
                          طاقة {task.energyRequired === 'high' ? 'عالية' : 
                                 task.energyRequired === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </div>
                        
                        {task.mood && (
                          <Badge variant="outline" className="text-xs">
                            {task.mood === 'focused' ? 'مركز' : 
                             task.mood === 'creative' ? 'مبدع' : 
                             task.mood === 'motivated' ? 'متحفز' : 'متعب'}
                          </Badge>
                        )}
                        
                        {task.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {task.location}
                          </div>
                        )}
                      </div>
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-1 mb-3">
                          {task.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {showAIFeatures && task.aiSuggestions && task.aiSuggestions.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                              اقتراحات ذكية:
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {task.aiSuggestions.slice(0, 2).map((suggestion, index) => (
                              <li key={index} className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-1">
                                <span className="text-blue-500 mt-1">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                          <Calendar className="w-3 h-3" />
                          موعد الانتهاء: {new Date(task.dueDate).toLocaleDateString("ar-SA")}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    {task.status === "pending" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startTask(task)}
                        className="gap-1"
                      >
                        <Timer className="w-3 h-3" />
                        ابدأ
                      </Button>
                    )}
                    
                    {task.status === "in_progress" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => pauseTask(task)}
                        className="gap-1"
                      >
                        <Coffee className="w-3 h-3" />
                        إيقاف
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      disabled={deleteTaskMutation.isPending}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Stats */}
      {sortedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              إحصائيات سريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => t.status === "completed").length}
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-300">مكتملة</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {tasks.filter(t => t.status === "in_progress").length}
                </div>
                <div className="text-sm text-orange-800 dark:text-orange-300">قيد التنفيذ</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.priority === "urgent").length}
                </div>
                <div className="text-sm text-green-800 dark:text-green-300">عاجلة</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((tasks.reduce((sum, t) => sum + (t.focusScore || 0), 0) / tasks.length) * 10) / 10}
                </div>
                <div className="text-sm text-green-800 dark:text-green-300">متوسط التركيز</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
