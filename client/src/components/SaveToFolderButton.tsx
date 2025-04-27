import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FolderPlus, Folder, Plus } from "lucide-react";
// استدعاء مكون Spinner من تعريفه في الملف التالي
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// تعريف مخطط المجلد باستخدام zod
const folderSchema = z.object({
  name: z.string().min(2, { message: "اسم المجلد يجب أن يحتوي على حرفين على الأقل" }),
  description: z.string().optional(),
  color: z.string().default("#4f46e5"),
  icon: z.string().default("folder"),
});

// استخراج نوع البيانات من المخطط
type FormValues = z.infer<typeof folderSchema>;

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

interface SaveToFolderButtonProps {
  questionId: number;
  buttonText?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
}

export function SaveToFolderButton({
  questionId,
  buttonText = "حفظ في مجلد",
  variant = "outline",
  size = "default",
  showIcon = true,
}: SaveToFolderButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  // طلب الحصول على المجلدات
  const { data: folders = [], isLoading: isFoldersLoading } = useQuery({
    queryKey: ["/api/folders/user/1"], // المستخدم الحالي برقم 1 (للعرض فقط)
    queryFn: async () => {
      try {
        const response = await fetch("/api/folders/user/1");
        return await response.json();
      } catch (error) {
        console.error("Error fetching folders:", error);
        return [];
      }
    }
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
    onSuccess: (newFolder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders/user/1"] });
      toast({
        title: "تم إنشاء المجلد بنجاح",
        description: "تم إضافة المجلد الجديد إلى قائمة المجلدات الخاصة بك",
      });
      setShowCreateForm(false);
      form.reset();
      setSelectedFolderId(newFolder.id.toString());
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من إنشاء المجلد. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  });

  // إعداد mutation لإضافة سؤال إلى مجلد
  const addToFolderMutation = useMutation({
    mutationFn: async ({ folderId, questionId }: { folderId: number, questionId: number }) => {
      const response = await apiRequest("POST", `/api/folders/${folderId}/questions`, {
        questionId
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ السؤال في المجلد المحدد",
      });
      setIsOpen(false);
      setSelectedFolderId("");
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من حفظ السؤال في المجلد. الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  });

  // معالجة إنشاء مجلد جديد
  const handleCreateFolder = (data: FormValues) => {
    createFolderMutation.mutate(data);
  };

  // معالجة حفظ السؤال في المجلد المحدد
  const handleSaveToFolder = () => {
    if (!selectedFolderId) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار مجلد أولاً",
        variant: "destructive",
      });
      return;
    }

    addToFolderMutation.mutate({
      folderId: parseInt(selectedFolderId),
      questionId
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          {showIcon && <FolderPlus className="w-4 h-4 mr-2" />}
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>حفظ السؤال في مجلد</DialogTitle>
          <DialogDescription>
            اختر مجلدًا لحفظ السؤال فيه أو قم بإنشاء مجلد جديد
          </DialogDescription>
        </DialogHeader>

        {showCreateForm ? (
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

              <div className="flex justify-between mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={createFolderMutation.isPending}
                >
                  {createFolderMutation.isPending ? "جاري الإنشاء..." : "إنشاء وإضافة"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <>
            <div className="my-4">
              {isFoldersLoading ? (
                <div className="flex justify-center">
                  <Spinner />
                </div>
              ) : folders.length === 0 ? (
                <div className="text-center py-4">
                  <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">لا توجد مجلدات محفوظة</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    قم بإنشاء مجلد جديد للبدء بتنظيم الأسئلة
                  </p>
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    className="mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    إنشاء مجلد جديد
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      اختر مجلدًا
                    </label>
                    <Select
                      value={selectedFolderId}
                      onValueChange={setSelectedFolderId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر مجلدًا" />
                      </SelectTrigger>
                      <SelectContent>
                        {folders.map((folder: any) => (
                          <SelectItem key={folder.id} value={folder.id.toString()}>
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: folder.color }}
                              ></div>
                              {folder.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateForm(true)}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      مجلد جديد
                    </Button>
                  </div>
                </>
              )}
            </div>

            {folders.length > 0 && (
              <DialogFooter>
                <Button
                  onClick={handleSaveToFolder}
                  disabled={addToFolderMutation.isPending || !selectedFolderId}
                >
                  {addToFolderMutation.isPending ? "جاري الحفظ..." : "حفظ في المجلد"}
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}