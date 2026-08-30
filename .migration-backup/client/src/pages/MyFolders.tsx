import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Folder, 
  Plus, 
  Trash2, 
  BookOpen, 
  GraduationCap,
  FileText,
  ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";

export default function MyFolders() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");
  const [selectedColor, setSelectedColor] = useState("#4f46e5");
  const [selectedIcon, setSelectedIcon] = useState("folder");

  const { data: user } = useQuery<any>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: folders = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/folders/user', user?.id],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user?.id,
  });

  const createFolderMutation = useMutation({
    mutationFn: async (folderData: any) => {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(folderData),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'فشل في إنشاء المجلد');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders/user', user?.id] });
      setIsCreateDialogOpen(false);
      setNewFolderName("");
      setNewFolderDesc("");
      toast({
        title: "✅ تم إنشاء المجلد",
        description: "تم إنشاء المجلد بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في إنشاء المجلد",
        variant: "destructive",
      });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'فشل في حذف المجلد');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders/user', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      toast({
        title: "🗑️ تم حذف المجلد",
        description: "تم حذف المجلد بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ خطأ في الحذف",
        description: error.message || "فشل في حذف المجلد",
        variant: "destructive",
      });
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "⚠️ خطأ",
        description: "يرجى إدخال اسم المجلد",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "⚠️ خطأ",
        description: "يرجى تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    createFolderMutation.mutate({
      userId: user.id,
      name: newFolderName.trim(),
      description: newFolderDesc.trim() || "",
      color: selectedColor,
      icon: selectedIcon,
      isDefault: false,
    });
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    if (confirm(`هل أنت متأكد من حذف المجلد "${folderName}"؟ سيتم حذف جميع الأسئلة المحفوظة فيه.`)) {
      deleteFolderMutation.mutate(folderId);
    }
  };

  const availableColors = [
    { name: "بنفسجي", value: "#4f46e5" },
    { name: "أزرق", value: "#3b82f6" },
    { name: "أخضر", value: "#10b981" },
    { name: "أحمر", value: "#ef4444" },
    { name: "برتقالي", value: "#f97316" },
    { name: "وردي", value: "#ec4899" },
  ];

  const availableIcons = [
    { name: "مجلد", value: "folder" },
    { name: "كتاب", value: "book" },
    { name: "نجمة", value: "star" },
    { name: "تخرج", value: "graduation" },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-teal-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل المجلدات...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">يرجى تسجيل الدخول لعرض المجلدات</p>
            <Button onClick={() => navigate('/login')} data-testid="button-login">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Folder className="h-8 w-8 text-teal-700" />
            مجلداتي
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            احفظ وراجع الأسئلة في مجلدات منظمة
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-100 hover:bg-teal-100" data-testid="button-create-folder">
              <Plus className="h-5 w-5 ml-2" />
              إنشاء مجلد جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>إنشاء مجلد جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="folder-name">اسم المجلد</Label>
                <Input
                  id="folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="مثال: أسئلة خاطئة - اللفظي"
                  className="mt-1"
                  data-testid="input-folder-name"
                />
              </div>
              <div>
                <Label htmlFor="folder-desc">الوصف (اختياري)</Label>
                <Textarea
                  id="folder-desc"
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  placeholder="وصف المجلد..."
                  className="mt-1"
                  rows={3}
                  data-testid="input-folder-description"
                />
              </div>
              <div>
                <Label>اللون</Label>
                <div className="flex gap-2 mt-2">
                  {availableColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        selectedColor === color.value ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                      data-testid={`button-color-${color.name}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateFolder} className="flex-1" disabled={createFolderMutation.isPending} data-testid="button-submit-folder">
                  {createFolderMutation.isPending ? "جاري الإنشاء..." : "إنشاء"}
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)} variant="outline" className="flex-1" data-testid="button-cancel">
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {folders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد مجلدات بعد
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ابدأ بإنشاء مجلد لحفظ الأسئلة المهمة
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-teal-100 hover:bg-teal-100" data-testid="button-create-first-folder">
              <Plus className="h-5 w-5 ml-2" />
              إنشاء أول مجلد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder: any) => (
            <FolderCard
              key={folder._id}
              folder={folder}
              onDelete={handleDeleteFolder}
              onView={(folderId) => navigate(`/folders/${folderId}`)}
              onTestMe={(folderId) => navigate(`/test-me?folder=${folderId}`)}
            />
          ))}
        </div>
      )}

      <Card className="mt-6 bg-gradient-to-br from-teal-600 to-blue-50 dark:from-teal-600 dark:to-blue-950 border-teal-400 dark:border-teal-400">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
              <GraduationCap className="h-6 w-6 text-teal-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                💡 نصيحة: استخدم "اختبرني"
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                احفظ الأسئلة الخاطئة أو الغير محلولة في مجلدات، ثم استخدم ميزة "اختبرني" لعمل اختبار إلكتروني من مجلد أو أكثر لمراجعتها بشكل منظم!
              </p>
              <Button 
                onClick={() => navigate('/test-me')} 
                className="mt-3 bg-teal-100 hover:bg-teal-100"
                data-testid="button-go-test-me"
              >
                <ChevronRight className="h-4 w-4 ml-1" />
                اذهب إلى اختبرني
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FolderCard({ 
  folder, 
  onDelete, 
  onView,
  onTestMe
}: { 
  folder: any; 
  onDelete: (id: string, name: string) => void; 
  onView: (id: string) => void;
  onTestMe: (id: string) => void;
}) {
  const { data: questions = [] } = useQuery({
    queryKey: ['/api/folders', folder._id, 'questions'],
    queryFn: async () => {
      const response = await fetch(`/api/folders/${folder._id}/questions`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'book':
        return <BookOpen className="h-6 w-6" />;
      case 'star':
        return <FileText className="h-6 w-6" />;
      case 'graduation':
        return <GraduationCap className="h-6 w-6" />;
      default:
        return <Folder className="h-6 w-6" />;
    }
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer group"
      style={{ borderRight: `4px solid ${folder.color}` }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
            >
              {getIconComponent(folder.icon)}
            </div>
            <div>
              <CardTitle className="text-lg">{folder.name}</CardTitle>
              {folder.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {folder.description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(folder._id, folder.name)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            data-testid={`button-delete-folder-${folder._id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-sm">
            {questions.length} سؤال
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onView(folder._id)}
            variant="outline"
            className="flex-1"
            size="sm"
            data-testid={`button-view-folder-${folder._id}`}
          >
            <BookOpen className="h-4 w-4 ml-1" />
            عرض الأسئلة
          </Button>
          <Button
            onClick={() => onTestMe(folder._id)}
            className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-600 hover:to-blue-700"
            size="sm"
            disabled={questions.length === 0}
            data-testid={`button-test-me-folder-${folder._id}`}
          >
            <GraduationCap className="h-4 w-4 ml-1" />
            اختبرني
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}