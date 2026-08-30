import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRealtimeUpdates, useFoldersRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { 
  Folder, 
  FolderIcon, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  BookOpen,
  Star,
  Heart,
  Award,
  Sparkles,
  ArrowRight,
  Download,
  Play,
  Clock,
  Eye
} from "lucide-react";

// تعريف مخطط المجلد باستخدام zod
const folderSchema = z.object({
  name: z.string().min(2, { message: "اسم المجلد يجب أن يحتوي على حرفين على الأقل" }),
  description: z.string().optional(),
  color: z.string().default("#4f46e5"),
  icon: z.string().default("folder"),
});

// استخراج نوع البيانات من المخطط
type FormValues = z.infer<typeof folderSchema>;

// تعريف نوع المجلد
type FolderType = {
  id: number;
  _id?: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  itemCount: number;
};

// تعريف نوع عنصر المجلد
type FolderItemType = {
  id: number;
  text: string;
  category: string;
  difficulty: string;
  addedAt: string;
  folderId: number;
};

// ألوان المجلدات
const folderColors = [
  { name: "أزرق", value: "#4f46e5" },
  { name: "أخضر", value: "#10b981" },
  { name: "أحمر", value: "#ef4444" },
  { name: "برتقالي", value: "#f97316" },
  { name: "أرجواني", value: "#8b5cf6" },
  { name: "وردي", value: "#ec4899" },
];

// أيقونات المجلدات
const folderIcons = [
  { name: "مجلد", value: "folder" },
  { name: "نجمة", value: "star" },
  { name: "قلب", value: "heart" },
  { name: "علامة", value: "bookmark" },
  { name: "علم", value: "flag" },
];

export default function FoldersPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [location, navigate] = useLocation();

  // إضافة تحديث تلقائي للمجلدات
  const { invalidateNow } = useRealtimeUpdates("/api/folders/user/1", {
    enabled: true,
    interval: 15000 // تحديث كل 15 ثانية
  });

  const foldersUpdate = useFoldersRealtimeUpdates(1);

  // استخدام مكتبة react-hook-form مع zod لإدارة نموذج إنشاء المجلد
  const form = useForm<FormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#4f46e5",
      icon: "folder",
    },
  });

  // طلب الحصول على المجلدات من API مع تحديث تلقائي
  const { data: folders = [], isLoading: isFoldersLoading } = useQuery({
    queryKey: ["/api/folders/user/1"], // المستخدم الحالي برقم 1 (للعرض فقط)
    queryFn: async () => {
      try {
        const response = await fetch("/api/folders/user/1");
        const data = await response.json();

        // جلب عدد الأسئلة لكل مجلد مع تحديث فوري
        const foldersWithCounts = await Promise.all(
          data.map(async (folder: any) => {
            try {
              const questionsResponse = await fetch(`/api/folders/${folder._id}/questions`);
              const questions = await questionsResponse.json();
              return {
                ...folder,
                itemCount: questions.length
              };
            } catch (error) {
              console.error(`Error fetching questions for folder ${folder._id}:`, error);
              return {
                ...folder,
                itemCount: 0
              };
            }
          })
        );

        return foldersWithCounts;
      } catch (error) {
        console.error("Error fetching folders:", error);
        return [];
      }
    },
    refetchInterval: 30000, // تحديث كل 30 ثانية
    staleTime: 10000, // البيانات تعتبر قديمة بعد 10 ثوانٍ
    refetchOnWindowFocus: true, // تحديث عند التركيز على النافذة
    refetchOnMount: true, // تحديث عند تحميل المكون
  });



  // إعداد mutation لإنشاء مجلد جديد مع تحديث فوري
  const createFolderMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/folders", {
        ...data,
        userId: 1 // المستخدم الحالي برقم 1 (للعرض فقط)
      });
      return await response.json();
    },
    onSuccess: (newFolder) => {
      // تحديث فوري للبيانات بدلاً من إعادة جلبها
      queryClient.setQueryData(["/api/folders/user/1"], (old: any) => {
        return old ? [...old, { ...newFolder, itemCount: 0 }] : [{ ...newFolder, itemCount: 0 }];
      });

      // تحديث البيانات في الخلفية
      queryClient.invalidateQueries({ queryKey: ["/api/folders/user/1"] });

      toast({
        title: "🎉 تم إنشاء المجلد بنجاح",
        description: "تم إضافة المجلد الجديد إلى قائمة المجلدات الخاصة بك",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من إنشاء المجلد. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  });

  // إعداد mutation لحذف مجلد مع تحديث فوري
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      await apiRequest("DELETE", `/api/folders/${folderId}`);
      return folderId;
    },
    onSuccess: (deletedFolderId) => {
      // تحديث فوري للبيانات بحذف المجلد من القائمة
      queryClient.setQueryData(["/api/folders/user/1"], (old: any) => {
        return old ? old.filter((folder: any) => folder._id !== deletedFolderId) : [];
      });

      // إزالة أي cache للأسئلة المرتبطة بالمجلد المحذوف
      queryClient.removeQueries({ queryKey: [`/api/folders/${deletedFolderId}`] });
      queryClient.removeQueries({ queryKey: [`/api/folders/${deletedFolderId}/questions`] });

      toast({
        title: "🗑️ تم حذف المجلد",
        description: "تم حذف المجلد وجميع العناصر المرتبطة به",
      });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من حذف المجلد. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  });



  // معالجة إنشاء مجلد جديد
  const handleCreateFolder = (data: FormValues) => {
    createFolderMutation.mutate(data);
  };

  // معالجة حذف مجلد
  const handleDeleteFolder = (folder: FolderType) => {
    if (confirm("هل أنت متأكد من حذف هذا المجلد؟ سيتم حذف جميع العناصر المحفوظة فيه.")) {
      deleteFolderMutation.mutate(folder._id as any);
    }
  };

  return (
    <div className="px-3 py-4 sm:px-6 sm:py-6">
      <div className="max-w-5xl mx-auto">
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-teal-500 rounded-3xl overflow-hidden p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* رأس الصفحة الإبداعي */}
        <div className="text-center mb-8">
          <div className="relative">
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-green-600 to-amber-600 bg-clip-text text-transparent mb-4">
              مجلداتي الإبداعية
            </h1>
            <div className="absolute inset-0 text-5xl font-black text-blue-400/20 blur-sm -z-10">
              مجلداتي الإبداعية
            </div>
          </div>
          <p className="text-blue-200 text-lg mb-6">نظّم أسئلتك وحقق أهدافك بأسلوب إبداعي</p>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600 text-white border-0 px-8 py-4 text-lg font-bold rounded-full shadow-lg shadow-blue-500/25">
                <Plus className="w-5 h-5 mr-2" />
                إنشاء مجلد جديد
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-400 text-xl">
                <Sparkles className="w-6 h-6" />
                إنشاء مجلد إبداعي جديد
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                أنشئ مجلداً مخصصاً لتنظيم أسئلتك بأسلوب فريد
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateFolder)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">اسم المجلد</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="مثال: أسئلة صعبة، مراجعة سريعة، تحدي الأسبوع..." 
                          {...field} 
                          className="bg-slate-800 border-slate-600 text-white"
                        />
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
                      <FormLabel className="text-slate-200">وصف المجلد (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="اكتب وصفاً يساعدك على تذكر محتوى هذا المجلد..." 
                          {...field} 
                          className="bg-slate-800 border-slate-600 text-white resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">لون المجلد</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                              <SelectValue placeholder="اختر لونًا" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            {folderColors.map((color) => (
                              <SelectItem key={color.value} value={color.value} className="text-white hover:bg-slate-700">
                                <div className="flex items-center">
                                  <div
                                    className="w-4 h-4 rounded-full mr-2"
                                    style={{ backgroundColor: color.value }}
                                  ></div>
                                  {color.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">الأيقونة</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                              <SelectValue placeholder="اختر أيقونة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            {folderIcons.map((icon) => (
                              <SelectItem key={icon.value} value={icon.value} className="text-white hover:bg-slate-700">
                                {icon.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="border-slate-600 text-slate-400 hover:bg-slate-800"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={createFolderMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600 border-0"
                  >
                    {createFolderMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري الإنشاء...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        إنشاء المجلد
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>

        {/* شبكة المجلدات الإبداعية */}
        {isFoldersLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-blue-200 text-lg">جاري تحميل مجلداتك الإبداعية...</p>
            </div>
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-600/20 to-emerald-600/20 rounded-3xl flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-blue-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">مجلداتك في انتظارك!</h3>
            <p className="text-blue-200 text-lg mb-8 max-w-md mx-auto">
              ابدأ رحلتك في تنظيم الأسئلة بإنشاء مجلدك الأول
            </p>

            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600 text-white border-0 px-8 py-4 text-lg font-bold rounded-full"
            >
              <Plus className="w-5 h-5 mr-2" />
              إنشاء أول مجلد
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {folders.map((folder: FolderType) => (
              <Card
                key={folder._id}
                className="bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer group overflow-hidden relative"
                onClick={() => navigate(`/folders/${folder._id}`)}
              >
                {/* خلفية متدرجة إبداعية */}
                <div 
                  className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{ 
                    background: `linear-gradient(135deg, ${folder.color}40, ${folder.color}10)` 
                  }}
                />

                {/* تأثير التوهج */}
                <div 
                  className="absolute -inset-1 blur-sm opacity-0 group-hover:opacity-20 transition-opacity"
                  style={{ backgroundColor: folder.color }}
                />

                <CardContent className="p-6 relative">
                  {/* رأس البطاقة */}
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: folder.color }}
                    >
                      {folder.icon === "star" && "⭐"}
                      {folder.icon === "heart" && "❤️"}
                      {folder.icon === "bookmark" && "🔖"}
                      {folder.icon === "flag" && "🚩"}
                      {folder.icon === "folder" && "📁"}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/folders/${folder._id}`);
                          }}
                          className="text-white hover:bg-slate-800"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          عرض المجلد
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            // إضافة وظيفة التعديل لاحقاً
                          }}
                          className="text-white hover:bg-slate-800"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder);
                          }}
                          className="text-red-400 hover:bg-red-600/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* عنوان المجلد */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {folder.name}
                  </h3>

                  {/* وصف المجلد */}
                  {folder.description && (
                    <p className="text-blue-200 text-sm mb-4 line-clamp-2">
                      {folder.description}
                    </p>
                  )}

                  {/* إحصائيات المجلد */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
                        <BookOpen className="w-4 h-4 text-blue-300" />
                        <span className="text-white text-sm font-medium">{folder.itemCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/10 p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/folders/${folder._id}`);
                        }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* شريط التقدم الإبداعي */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-blue-200 mb-2">
                      <span>مستوى الإنجاز</span>
                      <span>{Math.min(100, folder.itemCount * 5)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-emerald-600"
                        style={{ width: `${Math.min(100, folder.itemCount * 5)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>

                {/* تأثير الهوفر المتقدم */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400/30 rounded-lg transition-all pointer-events-none" />
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
      </div>
    </div>
  );
}