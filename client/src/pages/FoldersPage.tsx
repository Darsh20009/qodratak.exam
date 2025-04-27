import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  FolderIcon, 
  PlusIcon, 
  SettingsIcon, 
  Trash2Icon,
  FolderOpenIcon,
  Edit2Icon,
  PlusCircleIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Schema for folder creation
const folderSchema = z.object({
  name: z.string().min(2, {
    message: "يجب أن يكون اسم المجلد أكثر من حرفين",
  }),
  description: z.string().optional(),
  color: z.string().default("#4f46e5"),
  icon: z.string().default("folder"),
});

type FormValues = z.infer<typeof folderSchema>;

// Mock data for folders
// تعريف نوع المجلدات
type FolderType = {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  itemCount: number;
};

const mockFolders: FolderType[] = [
  {
    id: 1,
    name: "الأسئلة الصعبة",
    description: "مجموعة من الأسئلة الصعبة للمراجعة",
    color: "#ef4444",
    icon: "folder",
    itemCount: 24
  },
  {
    id: 2,
    name: "اختبارات سابقة",
    description: "أسئلة من اختبارات قمت بها مسبقًا",
    color: "#3b82f6",
    icon: "folder",
    itemCount: 45
  },
  {
    id: 3,
    name: "للمراجعة لاحقًا",
    description: "أسئلة أريد مراجعتها في وقت لاحق",
    color: "#10b981",
    icon: "folder",
    itemCount: 12
  }
];

// تعريف نوع عناصر المجلد
type FolderItemType = {
  id: number;
  text: string;
  category: string;
  difficulty: string;
  addedAt: string;
  folderId: number;
};

// Mock data for folder items (questions)
const mockFolderItems: FolderItemType[] = [
  {
    id: 1,
    text: "ما هو معنى كلمة 'استقصاء'؟",
    category: "verbal",
    difficulty: "intermediate",
    addedAt: new Date().toISOString(),
    folderId: 1
  },
  {
    id: 2,
    text: "إذا كان عدد طلاب الصف 30 طالبًا، ونسبة النجاح 80%، فكم عدد الطلاب الناجحين؟",
    category: "quantitative",
    difficulty: "beginner",
    addedAt: new Date().toISOString(),
    folderId: 1
  },
  {
    id: 3,
    text: "ما هو الجذر التربيعي للعدد 144؟",
    category: "quantitative",
    difficulty: "beginner",
    addedAt: new Date().toISOString(),
    folderId: 1
  }
];

const FoldersPage = () => {
  const { toast } = useToast();
  const [folders, setFolders] = useState(mockFolders);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [folderItems, setFolderItems] = useState<typeof mockFolderItems>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  
  // Initialize form for folder creation
  const form = useForm<FormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#4f46e5",
      icon: "folder",
    },
  });
  
  // Handle folder selection
  const handleFolderSelect = (folder: FolderType) => {
    setSelectedFolder(folder);
    // In a real app, this would fetch items from API
    setFolderItems(mockFolderItems.filter(item => item.folderId === folder.id));
  };
  
  // Handle folder creation
  const handleCreateFolder = (data: FormValues) => {
    const newFolder = {
      id: folders.length + 1,
      ...data,
      itemCount: 0
    };
    
    setFolders([...folders, newFolder]);
    setIsCreatingFolder(false);
    form.reset();
    
    toast({
      title: "تم إنشاء المجلد",
      description: `تم إنشاء مجلد "${data.name}" بنجاح`,
    });
  };
  
  // Handle folder deletion
  const handleDeleteFolder = (id: number) => {
    setFolders(folders.filter(folder => folder.id !== id));
    if (selectedFolder && selectedFolder.id === id) {
      setSelectedFolder(null);
      setFolderItems([]);
    }
    
    toast({
      title: "تم حذف المجلد",
      description: "تم حذف المجلد بنجاح",
    });
  };
  
  // Handle creating a test from folder
  const handleCreateTest = (folderId: number) => {
    // In a real app, this would navigate to a test creation page with selected folder items
    toast({
      title: "إنشاء اختبار",
      description: "جاري إنشاء اختبار من الأسئلة في هذا المجلد...",
    });
  };
  
  // Render folders grid or list
  const renderFolders = () => (
    <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-3 gap-6" : "space-y-3"}>
      {folders.map(folder => (
        <Card 
          key={folder.id} 
          className={cn(
            "cursor-pointer transition-all", 
            view === "grid" ? "h-full" : "flex flex-row items-center",
            selectedFolder?.id === folder.id && "ring-2 ring-primary"
          )}
          onClick={() => handleFolderSelect(folder)}
        >
          {view === "grid" ? (
            // Grid view
            <>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div 
                      className="p-2 rounded-md" 
                      style={{ backgroundColor: folder.color + "20" }}
                    >
                      <FolderIcon 
                        className="h-6 w-6" 
                        style={{ color: folder.color }} 
                      />
                    </div>
                    <CardTitle>{folder.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">فتح القائمة</span>
                        <SettingsIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>خيارات المجلد</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(folder.id);
                      }}>
                        <PlusCircleIcon className="ml-2 h-4 w-4" />
                        <span>إنشاء اختبار</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Edit2Icon className="ml-2 h-4 w-4" />
                        <span>تعديل المجلد</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                      >
                        <Trash2Icon className="ml-2 h-4 w-4" />
                        <span>حذف المجلد</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{folder.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {folder.itemCount} سؤال
                </div>
              </CardContent>
            </>
          ) : (
            // List view
            <div className="flex flex-1 items-center p-4">
              <div 
                className="p-2 rounded-md mr-4" 
                style={{ backgroundColor: folder.color + "20" }}
              >
                <FolderIcon 
                  className="h-5 w-5" 
                  style={{ color: folder.color }} 
                />
              </div>
              <div className="flex-1 ml-4">
                <h3 className="font-medium">{folder.name}</h3>
                <p className="text-sm text-muted-foreground">{folder.itemCount} سؤال</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                    <span className="sr-only">فتح القائمة</span>
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>خيارات المجلد</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleCreateTest(folder.id);
                  }}>
                    <PlusCircleIcon className="ml-2 h-4 w-4" />
                    <span>إنشاء اختبار</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                    <Edit2Icon className="ml-2 h-4 w-4" />
                    <span>تعديل المجلد</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                  >
                    <Trash2Icon className="ml-2 h-4 w-4" />
                    <span>حذف المجلد</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </Card>
      ))}
      
      {/* Create Folder Card/Button */}
      <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
        <DialogTrigger asChild>
          {view === "grid" ? (
            <Card className="h-full cursor-pointer border-dashed">
              <div className="flex flex-col items-center justify-center h-full p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <PlusIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">إنشاء مجلد جديد</h3>
                <p className="text-sm text-center text-muted-foreground mt-2">
                  قم بإنشاء مجلد جديد لتنظيم الأسئلة والاختبارات
                </p>
              </div>
            </Card>
          ) : (
            <Button className="w-full" variant="outline">
              <PlusIcon className="ml-2 h-4 w-4" />
              إنشاء مجلد جديد
            </Button>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء مجلد جديد</DialogTitle>
            <DialogDescription>
              قم بإدخال معلومات المجلد الجديد لتنظيم الأسئلة والاختبارات.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateFolder)}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المجلد</Label>
                <Input 
                  id="name"
                  placeholder="أدخل اسم المجلد"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">وصف المجلد (اختياري)</Label>
                <Input 
                  id="description"
                  placeholder="أدخل وصفًا للمجلد"
                  {...form.register("description")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">لون المجلد</Label>
                <div className="flex gap-2">
                  {["#4f46e5", "#ef4444", "#10b981", "#f59e0b", "#6366f1"].map(color => (
                    <div 
                      key={color}
                      className={cn(
                        "h-8 w-8 rounded-full cursor-pointer border-2",
                        form.watch("color") === color ? "border-primary" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => form.setValue("color", color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreatingFolder(false)}>
                إلغاء
              </Button>
              <Button type="submit">إنشاء المجلد</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
  
  // Render folder items
  const renderFolderItems = () => (
    <div className="space-y-4">
      {folderItems.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">{selectedFolder?.name}</h2>
              <p className="text-sm text-muted-foreground">
                {folderItems.length} سؤال في هذا المجلد
              </p>
            </div>
            <Button onClick={() => handleCreateTest(selectedFolder!.id)}>
              <PlusCircleIcon className="ml-2 h-4 w-4" />
              إنشاء اختبار
            </Button>
          </div>
          
          <div className="space-y-4">
            {folderItems.map(item => (
              <Card key={item.id}>
                <CardContent className="py-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "text-xs px-2 py-1 rounded-md",
                          item.category === "verbal" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
                        )}>
                          {item.category === "verbal" ? "لفظي" : "كمي"}
                        </div>
                        <div className={cn(
                          "text-xs px-2 py-1 rounded-md",
                          item.difficulty === "beginner" ? "bg-green-100 text-green-800" :
                          item.difficulty === "intermediate" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {item.difficulty === "beginner" ? "مبتدئ" :
                           item.difficulty === "intermediate" ? "متوسط" : "متقدم"}
                        </div>
                      </div>
                      <p>{item.text}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setFolderItems(folderItems.filter(i => i.id !== item.id));
                        toast({
                          title: "تم إزالة السؤال",
                          description: "تم إزالة السؤال من المجلد بنجاح",
                        });
                      }}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : selectedFolder ? (
        <div className="text-center py-8">
          <FolderOpenIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">المجلد فارغ</h3>
          <p className="text-muted-foreground mb-4">
            لا توجد أسئلة في هذا المجلد. يمكنك إضافة أسئلة من صفحة الاختبارات أو المكتبة.
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <FolderIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">اختر مجلدًا</h3>
          <p className="text-muted-foreground">
            الرجاء اختيار مجلد من القائمة لعرض محتوياته
          </p>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">مجلداتي</h1>
          <p className="text-muted-foreground">
            قم بإدارة مجلداتك وتنظيم الأسئلة للمراجعة والتدرب
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("grid")}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">عرض الشبكة</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">عرض القائمة</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">المجلدات</h2>
            {renderFolders()}
          </div>
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium mb-4">محتويات المجلد</h2>
          {renderFolderItems()}
        </div>
      </div>
    </div>
  );
};

export default FoldersPage;