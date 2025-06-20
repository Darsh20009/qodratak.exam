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
  Trash2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const taskSchema = z.object({
  title: z.string().min(1, "عنوان المهمة مطلوب"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  category: z.enum(["work", "personal", "study", "fitness"]),
  dueDate: z.string().optional(),
  estimatedTime: z.number().optional(),
  projectId: z.number().optional(),
});

interface TaskManagerProps {
  userId: number;
  tasks: any[];
  projects: any[];
}

export const TaskManager = ({ userId, tasks, projects }: TaskManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
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
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/tasks`, "POST", { 
      ...data, 
      userId,
      status: "pending",
      dueDate: data.dueDate ? new Date(data.dueDate) : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "تم إنشاء المهمة",
        description: "تم إضافة المهمة الجديدة بنجاح",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/tasks/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", userId] });
      toast({
        title: "تم تحديث المهمة",
        description: "تم تحديث المهمة بنجاح",
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

  const onSubmit = (data: z.infer<typeof taskSchema>) => {
    createTaskMutation.mutate(data);
  };

  const toggleTaskStatus = (task: any) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    updateTaskMutation.mutate({ 
      id: task.id, 
      data: { 
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date() : null
      }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-100 dark:bg-red-900/30";
      case "medium": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
      case "low": return "text-green-600 bg-green-100 dark:bg-green-900/30";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "عالية";
      case "medium": return "متوسطة";
      case "low": return "منخفضة";
      default: return priority;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "work": return "عمل";
      case "personal": return "شخصي";
      case "study": return "دراسة";
      case "fitness": return "لياقة";
      default: return category;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterCategory !== "all" && task.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">إدارة المهام</h2>
          <p className="text-gray-600 dark:text-gray-400">
            نظم مهامك وزد إنتاجيتك
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              مهمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إنشاء مهمة جديدة</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان المهمة</FormLabel>
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
                        <Textarea placeholder="تفاصيل المهمة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="low">منخفضة</SelectItem>
                            <SelectItem value="medium">متوسطة</SelectItem>
                            <SelectItem value="high">عالية</SelectItem>
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
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createTaskMutation.isPending}
                    className="flex-1"
                  >
                    {createTaskMutation.isPending ? "جاري الإنشاء..." : "إنشاء المهمة"}
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

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">الحالة:</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">الفئة:</span>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="personal">شخصي</SelectItem>
              <SelectItem value="work">عمل</SelectItem>
              <SelectItem value="study">دراسة</SelectItem>
              <SelectItem value="fitness">لياقة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                لا توجد مهام
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                ابدأ بإضافة مهمة جديدة لتنظيم وقتك
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task: any) => (
            <Card key={task.id} className={`transition-all hover:shadow-md ${
              task.status === "completed" ? "opacity-75" : ""
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="mt-1 transition-colors hover:scale-110"
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        task.status === "completed" ? "line-through text-gray-500" : ""
                      }`}>
                        {task.title}
                      </h3>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3">
                        <Badge className={getPriorityColor(task.priority)}>
                          <Flag className="w-3 h-3 mr-1" />
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        
                        <Badge variant="outline">
                          {getCategoryLabel(task.category)}
                        </Badge>
                        
                        {task.estimatedTime && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            {task.estimatedTime} دقيقة
                          </div>
                        )}
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString("ar-SA")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      disabled={deleteTaskMutation.isPending}
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
    </div>
  );
};