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
  Folder, 
  Calendar, 
  Users,
  CheckCircle2,
  Circle,
  MoreHorizontal
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const projectSchema = z.object({
  name: z.string().min(1, "اسم المشروع مطلوب"),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "on_hold", "cancelled"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  color: z.string().default("blue"),
});

interface ProjectManagerProps {
  userId: number;
  projects: any[];
  tasks: any[];
}

export const ProjectManager = ({ userId, projects, tasks }: ProjectManagerProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      startDate: "",
      endDate: "",
      color: "blue",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/projects`, "POST", { 
      ...data, 
      userId,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", userId] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "تم إنشاء المشروع",
        description: "تم إضافة المشروع الجديد بنجاح",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof projectSchema>) => {
    createProjectMutation.mutate(data);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "نشط";
      case "completed": return "مكتمل";
      case "on_hold": return "معلق";
      case "cancelled": return "ملغي";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "completed": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
      case "on_hold": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
      case "cancelled": return "text-red-600 bg-red-100 dark:bg-red-900/30";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getProjectProgress = (projectId: number) => {
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
    return (completedTasks / projectTasks.length) * 100;
  };

  const getProjectTaskCount = (projectId: number) => {
    return tasks.filter(task => task.projectId === projectId).length;
  };

  const getCompletedTaskCount = (projectId: number) => {
    return tasks.filter(task => task.projectId === projectId && task.status === 'completed').length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">إدارة المشاريع</h2>
          <p className="text-gray-600 dark:text-gray-400">
            نظم مشاريعك وتابع تقدمك
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              مشروع جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إنشاء مشروع جديد</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المشروع</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم المشروع" {...field} />
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
                        <Textarea placeholder="وصف المشروع وأهدافه" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحالة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">نشط</SelectItem>
                          <SelectItem value="on_hold">معلق</SelectItem>
                          <SelectItem value="completed">مكتمل</SelectItem>
                          <SelectItem value="cancelled">ملغي</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ البداية</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ النهاية</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createProjectMutation.isPending}
                    className="flex-1"
                  >
                    {createProjectMutation.isPending ? "جاري الإنشاء..." : "إنشاء المشروع"}
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

      {/* Projects Grid */}
      <div className="grid gap-6">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                لا توجد مشاريع
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                ابدأ بإنشاء مشروع جديد لتنظيم مهامك
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => {
              const progress = getProjectProgress(project.id);
              const totalTasks = getProjectTaskCount(project.id);
              const completedTasks = getCompletedTaskCount(project.id);
              
              return (
                <Card key={project.id} className="hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Folder className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusLabel(project.status)}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {project.description}
                      </p>
                    )}

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>التقدم</span>
                        <span>{completedTasks}/{totalTasks} مهمة</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="text-xs text-gray-500 text-left">
                        {Math.round(progress)}% مكتمل
                      </div>
                    </div>

                    {/* Dates */}
                    {(project.startDate || project.endDate) && (
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {project.startDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>البداية: {new Date(project.startDate).toLocaleDateString("ar-SA")}</span>
                          </div>
                        )}
                        {project.endDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>النهاية: {new Date(project.endDate).toLocaleDateString("ar-SA")}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{totalTasks}</div>
                        <div className="text-xs text-gray-500">المهام</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{completedTasks}</div>
                        <div className="text-xs text-gray-500">مكتملة</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-600">{totalTasks - completedTasks}</div>
                        <div className="text-xs text-gray-500">متبقية</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Overview */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>نظرة عامة على المشاريع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {projects.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm text-gray-500">مشاريع نشطة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500">مكتملة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {projects.filter(p => p.status === 'on_hold').length}
                </div>
                <div className="text-sm text-gray-500">معلقة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {tasks.filter(t => t.projectId).length}
                </div>
                <div className="text-sm text-gray-500">مهام مرتبطة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};