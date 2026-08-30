import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FolderPlus, Folder, Plus, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface EnhancedSaveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionIds: number[];
  saveMode?: "all" | "wrong" | "unanswered" | "selected";
  onSuccess?: () => void;
}

export function EnhancedSaveToFolderDialog({
  open,
  onOpenChange,
  questionIds,
  saveMode = "all",
  onSuccess
}: EnhancedSaveToFolderDialogProps) {
  const { toast } = useToast();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#4f46e5");
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);

  const { data: user } = useQuery<{ id: number; username: string }>({
    queryKey: ['/api/user'],
  });

  const { data: folders = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/folders/user', user?.id],
    enabled: open && !!user?.id,
  });

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const response = await fetch("/api/folders", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          name: newFolderName,
          description: newFolderDescription,
          color: newFolderColor,
          icon: 'folder',
          isDefault: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create folder');
      }
      return response.json();
    },
    onSuccess: (newFolder) => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders/user', user?.id] });
      setShowNewFolder(false);
      setNewFolderName("");
      setNewFolderDescription("");
      setSelectedFolderIds([...selectedFolderIds, newFolder._id]);
      toast({
        title: "✅ تم إنشاء المجلد",
        description: "تم إنشاء المجلد بنجاح وإضافته للاختيار",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل إنشاء المجلد",
        variant: "destructive",
      });
    },
  });

  const saveQuestionsMutation = useMutation({
    mutationFn: async (folderIds: string[]) => {
      const promises = folderIds.map(async (folderId) => {
        const response = await fetch(`/api/folders/${folderId}/questions/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ questionIds }),
        });
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(errorText || `Failed to save to folder ${folderId}`);
        }
        
        return response.json();
      });
      return Promise.all(promises);
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders/user', user?.id] });
      selectedFolderIds.forEach(folderId => {
        queryClient.invalidateQueries({ queryKey: ['/api/folders', folderId, 'questions'] });
        queryClient.invalidateQueries({ queryKey: [`/api/folders/${folderId}/questions`] });
      });
      
      const totalAdded = results.reduce((sum, r) => sum + (r.added || 0), 0);
      const totalSkipped = results.reduce((sum, r) => sum + (r.skipped || 0), 0);
      
      toast({
        title: "✅ تم الحفظ",
        description: `تم حفظ ${questionIds.length} سؤال إلى ${selectedFolderIds.length} مجلد${totalSkipped > 0 ? ` (تم تجاوز ${totalSkipped} سؤال موجود مسبقاً)` : ''}`,
      });
      onOpenChange(false);
      onSuccess?.();
      setSelectedFolderIds([]);
    },
    onError: (error: Error) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل حفظ الأسئلة، حاول مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (selectedFolderIds.length === 0) {
      toast({
        title: "⚠️ تنبيه",
        description: "يرجى اختيار مجلد واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (questionIds.length === 0) {
      toast({
        title: "⚠️ تنبيه",
        description: "لا توجد أسئلة للحفظ",
        variant: "destructive",
      });
      return;
    }

    saveQuestionsMutation.mutate(selectedFolderIds);
  };

  const toggleFolder = (folderId: string) => {
    setSelectedFolderIds(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "⚠️ خطأ",
        description: "يرجى إدخال اسم المجلد",
        variant: "destructive",
      });
      return;
    }
    createFolderMutation.mutate();
  };

  const folderColors = [
    { name: "بنفسجي", value: "#4f46e5" },
    { name: "أزرق", value: "#3b82f6" },
    { name: "أخضر", value: "#10b981" },
    { name: "أحمر", value: "#ef4444" },
    { name: "برتقالي", value: "#f97316" },
    { name: "وردي", value: "#ec4899" },
  ];

  const saveModeText = {
    all: "جميع الأسئلة",
    wrong: "الأسئلة الخطأ فقط",
    unanswered: "الأسئلة غير المحلولة فقط",
    selected: "الأسئلة المحددة"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>حفظ الأسئلة في مجلد</DialogTitle>
          <DialogDescription>
            حفظ {saveModeText[saveMode]} ({questionIds.length} سؤال) في المجلدات
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="select" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select" onClick={() => setShowNewFolder(false)}>
              اختر من المجلدات
            </TabsTrigger>
            <TabsTrigger value="create" onClick={() => setShowNewFolder(true)}>
              <Plus className="h-4 w-4 ml-1" />
              إنشاء مجلد جديد
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">لا توجد مجلدات</p>
                <p className="text-sm text-muted-foreground mb-4">
                  قم بإنشاء مجلد جديد للبدء
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    اختر المجلدات (يمكنك اختيار أكثر من مجلد)
                  </Label>
                  <Badge variant="outline">
                    {selectedFolderIds.length} مختار
                  </Badge>
                </div>
                <ScrollArea className="h-[300px] rounded-lg border p-2">
                  <div className="space-y-2">
                    {folders.map((folder: any) => (
                      <button
                        key={folder._id}
                        onClick={() => toggleFolder(folder._id)}
                        className={`w-full p-3 rounded-lg border-2 text-right transition-all ${
                          selectedFolderIds.includes(folder._id)
                            ? 'border-teal-400 bg-teal-100 dark:bg-teal-100'
                            : 'border-gray-200 dark:border-gray-700 hover:border-teal-400'
                        }`}
                        data-testid={`folder-${folder._id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: folder.color }}
                            />
                            <div className="flex-1 text-right">
                              <p className="font-medium">{folder.name}</p>
                              {folder.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {folder.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {selectedFolderIds.includes(folder._id) && (
                            <Check className="h-5 w-5 text-teal-700 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">اسم المجلد</Label>
              <Input
                id="folder-name"
                placeholder="مثال: الأسئلة الخطأ - اختبار قدراتك"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                data-testid="input-folder-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder-desc">وصف المجلد (اختياري)</Label>
              <Input
                id="folder-desc"
                placeholder="وصف قصير للمجلد"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                data-testid="input-folder-description"
              />
            </div>

            <div className="space-y-2">
              <Label>لون المجلد</Label>
              <Select value={newFolderColor} onValueChange={setNewFolderColor}>
                <SelectTrigger data-testid="select-folder-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {folderColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreateFolder}
              disabled={createFolderMutation.isPending}
              className="w-full"
              data-testid="button-create-folder"
            >
              {createFolderMutation.isPending ? "جاري الإنشاء..." : "إنشاء المجلد"}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {questionIds.length} سؤال • {selectedFolderIds.length} مجلد
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveQuestionsMutation.isPending || selectedFolderIds.length === 0}
              data-testid="button-save"
            >
              {saveQuestionsMutation.isPending ? "جاري الحفظ..." : "حفظ في المجلدات"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
