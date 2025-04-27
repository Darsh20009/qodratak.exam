import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "wouter";
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
import { Folder, FolderIcon } from "lucide-react";

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
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
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
  
  // طلب الحصول على المجلدات من API
  const { data: folders = [], isLoading: isFoldersLoading } = useQuery({
    queryKey: ["/api/folders/user/1"], // المستخدم الحالي برقم 1 (للعرض فقط)
    queryFn: async () => {
      try {
        const response = await fetch("/api/folders/user/1");
        const data = await response.json();
        return data.map((folder: any) => ({
          ...folder,
          itemCount: 0 // سيتم تحديثه لاحقًا
        }));
      } catch (error) {
        console.error("Error fetching folders:", error);
        return [];
      }
    }
  });
  
  // طلب الحصول على عناصر المجلد عند تحديد مجلد
  const { data: folderItems = [], isLoading: isFolderItemsLoading } = useQuery({
    queryKey: ["/api/folders", selectedFolder?.id, "questions"],
    queryFn: async () => {
      if (!selectedFolder) return [];
      try {
        const response = await fetch(`/api/folders/${selectedFolder.id}/questions`);
        return await response.json();
      } catch (error) {
        console.error("Error fetching folder items:", error);
        return [];
      }
    },
    enabled: !!selectedFolder
  });
  
  // إعداد mutation لإنشاء مجلد جديد
  const createFolderMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/folders", {
        ...data,
        userId: 1 // المستخدم الحالي برقم 1 (للعرض فقط)
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders/user/1"] });
      toast({
        title: "تم إنشاء المجلد بنجاح",
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
  
  // إعداد mutation لحذف مجلد
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      await apiRequest("DELETE", `/api/folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders/user/1"] });
      if (selectedFolder) {
        setSelectedFolder(null);
      }
      toast({
        title: "تم حذف المجلد",
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
  
  // إعداد mutation لحذف عنصر من المجلد
  const removeItemMutation = useMutation({
    mutationFn: async ({ folderId, questionId }: { folderId: number, questionId: number }) => {
      await apiRequest("DELETE", `/api/folders/${folderId}/questions/${questionId}`);
    },
    onSuccess: () => {
      if (selectedFolder) {
        queryClient.invalidateQueries({ queryKey: ["/api/folders", selectedFolder.id, "questions"] });
      }
      toast({
        title: "تم إزالة العنصر",
        description: "تم إزالة العنصر من المجلد بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من إزالة العنصر. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  });
  
  // معالجة تحديد المجلد
  const handleFolderSelect = (folder: FolderType) => {
    setSelectedFolder(folder);
  };
  
  // معالجة إنشاء مجلد جديد
  const handleCreateFolder = (data: FormValues) => {
    createFolderMutation.mutate(data);
  };
  
  // معالجة حذف مجلد
  const handleDeleteFolder = (folder: FolderType) => {
    if (confirm("هل أنت متأكد من حذف هذا المجلد؟ سيتم حذف جميع العناصر المحفوظة فيه.")) {
      deleteFolderMutation.mutate(folder.id);
    }
  };
  
  // معالجة إزالة عنصر من المجلد
  const handleRemoveItem = (questionId: number) => {
    if (selectedFolder && confirm("هل أنت متأكد من إزالة هذا العنصر من المجلد؟")) {
      removeItemMutation.mutate({
        folderId: selectedFolder.id,
        questionId
      });
    }
  };
  
  // تحويل الألوان إلى شكل اسم عربي
  const getColorName = (colorValue: string) => {
    const color = folderColors.find(c => c.value === colorValue);
    return color ? color.name : "أزرق";
  };
  
  // تحويل الأيقونات إلى شكل اسم عربي
  const getIconName = (iconValue: string) => {
    const icon = folderIcons.find(i => i.value === iconValue);
    return icon ? icon.name : "مجلد";
  };
  
  // ترتيب عناصر المجلد حسب تاريخ الإضافة
  const sortedFolderItems = [...folderItems].sort((a, b) => 
    new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );
  
  return (
    <div className="container mx-auto p-4 rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">المجلدات</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>إنشاء مجلد جديد</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>إنشاء مجلد جديد</DialogTitle>
              <DialogDescription>
                قم بإنشاء مجلد جديد لتنظيم الأسئلة وحفظها
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateFolder)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المجلد</FormLabel>
                      <FormControl>
                        <Input placeholder="ادخل اسم المجلد" {...field} />
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
                      <FormLabel>وصف المجلد (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="ادخل وصفًا للمجلد" {...field} />
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
                        <FormLabel>لون المجلد</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر لونًا" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {folderColors.map((color) => (
                              <SelectItem key={color.value} value={color.value}>
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
                        <FormLabel>الأيقونة</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر أيقونة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {folderIcons.map((icon) => (
                              <SelectItem key={icon.value} value={icon.value}>
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
                    type="submit"
                    disabled={createFolderMutation.isPending}
                  >
                    {createFolderMutation.isPending ? "جاري الإنشاء..." : "إنشاء المجلد"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* قائمة المجلدات */}
        <div className="md:col-span-4">
          <div className="bg-card rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">المجلدات المحفوظة</h2>
            {isFoldersLoading ? (
              <p>جاري تحميل المجلدات...</p>
            ) : folders.length === 0 ? (
              <div className="text-center p-8">
                <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">لا توجد مجلدات محفوظة</p>
                <p className="text-sm text-muted-foreground mt-1">
                  قم بإنشاء مجلد جديد للبدء بتنظيم الأسئلة
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {folders.map((folder: FolderType) => (
                  <div
                    key={folder.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors flex justify-between items-center ${
                      selectedFolder?.id === folder.id
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleFolderSelect(folder)}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center mr-3"
                        style={{ backgroundColor: folder.color }}
                      >
                        <FolderIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">{folder.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {folder.itemCount} عنصر
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <span className="sr-only">فتح القائمة</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          حذف المجلد
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* محتوى المجلد المحدد */}
        <div className="md:col-span-8">
          {selectedFolder ? (
            <div className="bg-card rounded-lg shadow-md p-4">
              <div className="flex items-center mb-6">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center mr-3"
                  style={{ backgroundColor: selectedFolder.color }}
                >
                  <FolderIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{selectedFolder.name}</h2>
                  {selectedFolder.description && (
                    <p className="text-muted-foreground">
                      {selectedFolder.description}
                    </p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {getColorName(selectedFolder.color)} &middot;{" "}
                    {getIconName(selectedFolder.icon)}
                  </span>
                </div>
              </div>

              {isFolderItemsLoading ? (
                <p>جاري تحميل العناصر...</p>
              ) : sortedFolderItems.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    لا توجد عناصر في هذا المجلد
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    يمكنك إضافة أسئلة من صفحة الأسئلة أو صفحة نتائج البحث
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedFolderItems.map((item: any) => (
                    <Card key={item.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <div className="flex space-x-2">
                            <span
                              className={`px-2 py-1 rounded-md text-xs ${
                                item.category === "verbal"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {item.category === "verbal" ? "لفظي" : "كمي"}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800`}
                            >
                              {item.difficulty === "beginner"
                                ? "مبتدئ"
                                : item.difficulty === "intermediate"
                                ? "متوسط"
                                : "متقدم"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 absolute top-2 right-2"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-muted-foreground"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="pt-2 text-lg font-medium">{item.text}</p>
                        <div className="mt-2 flex space-x-2 items-center text-sm text-muted-foreground">
                          <span>تمت الإضافة: {new Date(item.addedAt).toLocaleDateString("ar-SA")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-md p-8 text-center flex flex-col items-center justify-center" style={{ minHeight: "300px" }}>
              <Folder className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">لم يتم تحديد أي مجلد</h3>
              <p className="text-muted-foreground mb-6">
                اختر مجلدًا من القائمة لعرض محتوياته، أو قم بإنشاء مجلد جديد
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                إنشاء مجلد جديد
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}