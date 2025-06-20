import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Target, 
  CheckCircle2, 
  Circle, 
  Flame,
  Calendar,
  TrendingUp,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const habitSchema = z.object({
  name: z.string().min(1, "اسم العادة مطلوب"),
  description: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  targetCount: z.number().min(1),
  category: z.enum(["health", "learning", "productivity", "social"]),
  icon: z.string().default("target"),
  color: z.string().default("blue"),
});

interface HabitTrackerProps {
  userId: number;
  habits: any[];
}

export const HabitTracker = ({ userId, habits }: HabitTrackerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof habitSchema>>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: "",
      description: "",
      frequency: "daily",
      targetCount: 1,
      category: "health",
      icon: "target",
      color: "blue",
    },
  });

  const createHabitMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/habits`, "POST", { 
      ...data, 
      userId,
      isActive: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits", userId] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "تم إنشاء العادة",
        description: "تم إضافة العادة الجديدة بنجاح",
      });
    },
  });

  const logHabitMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/habit-logs`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits", userId] });
      toast({
        title: "تم تسجيل العادة",
        description: "تم تسجيل تقدمك في العادة",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof habitSchema>) => {
    createHabitMutation.mutate(data);
  };

  const logHabit = (habitId: number) => {
    logHabitMutation.mutate({
      habitId,
      userId,
      date: new Date(),
      count: 1
    });
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily": return "يومي";
      case "weekly": return "أسبوعي";
      case "monthly": return "شهري";
      default: return frequency;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "health": return "صحة";
      case "learning": return "تعلم";
      case "productivity": return "إنتاجية";
      case "social": return "اجتماعي";
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "health": return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "learning": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "productivity": return "text-purple-600 bg-purple-100 dark:bg-purple-900/30";
      case "social": return "text-orange-600 bg-orange-100 dark:bg-orange-900/30";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">تتبع العادات</h2>
          <p className="text-gray-600 dark:text-gray-400">
            ابني عادات إيجابية وتابع تقدمك اليومي
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              عادة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إنشاء عادة جديدة</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم العادة</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: شرب 8 أكواب ماء" {...field} />
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
                        <Textarea placeholder="تفاصيل العادة ولماذا تريد بناءها" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>التكرار</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">يومي</SelectItem>
                            <SelectItem value="weekly">أسبوعي</SelectItem>
                            <SelectItem value="monthly">شهري</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الهدف</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          <SelectItem value="health">صحة</SelectItem>
                          <SelectItem value="learning">تعلم</SelectItem>
                          <SelectItem value="productivity">إنتاجية</SelectItem>
                          <SelectItem value="social">اجتماعي</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createHabitMutation.isPending}
                    className="flex-1"
                  >
                    {createHabitMutation.isPending ? "جاري الإنشاء..." : "إنشاء العادة"}
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

      {/* Today's Habits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            عادات اليوم
          </CardTitle>
        </CardHeader>
        <CardContent>
          {habits.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                لا توجد عادات
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                ابدأ ببناء عادة جديدة لتحسين حياتك
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {habits.map((habit: any) => (
                <div key={habit.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{habit.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge className={getCategoryColor(habit.category)}>
                          {getCategoryLabel(habit.category)}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getFrequencyLabel(habit.frequency)} • الهدف: {habit.targetCount}
                        </span>
                      </div>
                      {habit.description && (
                        <p className="text-sm text-gray-500 mt-1">{habit.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-xs text-gray-500">اليوم</div>
                    </div>
                    <Button 
                      onClick={() => logHabit(habit.id)}
                      disabled={logHabitMutation.isPending}
                      size="sm"
                      className="gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      تم
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            التقدم الأسبوعي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {habits.map((habit: any) => (
              <div key={habit.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{habit.name}</span>
                  <span className="text-sm text-gray-500">0/{habit.targetCount * 7}</span>
                </div>
                <Progress value={0} className="h-2" />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>0% مكتمل</span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    سلسلة: 0 أيام
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};