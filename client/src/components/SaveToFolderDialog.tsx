import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FolderPlus, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SaveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionIds: number[];
  onSuccess?: () => void;
}

export function SaveToFolderDialog({ 
  open, 
  onOpenChange, 
  questionIds, 
  onSuccess 
}: SaveToFolderDialogProps) {
  const { toast } = useToast();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Get current user
  const { data: user } = useQuery<any>({
    queryKey: ['/api/user'],
  });

  // Load user's folders
  const { data: folders = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/folders/user', user?.id],
    enabled: open && !!user?.id,
  });

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          name: newFolderName,
          description: newFolderDescription,
          color: randomColor,
          icon: 'folder',
          isDefault: false,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create folder');
      }
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders/user', user?.id] });
      setShowNewFolder(false);
      setNewFolderName("");
      setNewFolderDescription("");
      response.json().then((folder: any) => {
        setSelectedFolderId(folder._id);
        toast({
          title: "✅ تم الإنشاء",
          description: "تم إنشاء المجلد بنجاح",
        });
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
    mutationFn: async (folderId: string) => {
      const promises = questionIds.map(questionId =>
        fetch(`/api/folders/${folderId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId }),
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      toast({
        title: "✅ تم الحفظ",
        description: `تم حفظ ${questionIds.length} سؤال إلى المجلد`,
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "❌ خطأ",
        description: "فشل حفظ الأسئلة، بعض الأسئلة قد تكون محفوظة مسبقاً",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!selectedFolderId) {
      toast({
        title: "⚠️ تنبيه",
        description: "يرجى اختيار مجلد أولاً",
        variant: "destructive",
      });
      return;
    }
    saveQuestionsMutation.mutate(selectedFolderId);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "⚠️ تنبيه",
        description: "يرجى إدخال اسم المجلد",
        variant: "destructive",
      });
      return;
    }
    createFolderMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            حفظ إلى مجلد
          </DialogTitle>
          <DialogDescription>
            اختر مجلداً لحفظ {questionIds.length} سؤال فيه
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showNewFolder ? (
            <>
              <div>
                <Label>اختر المجلد</Label>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
                ) : folders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد مجلدات، أنشئ مجلداً جديداً
                  </div>
                ) : (
                  <ScrollArea className="h-[200px] mt-2 border rounded-lg">
                    <div className="p-2 space-y-2">
                      {folders.map((folder: any) => (
                        <button
                          key={folder._id}
                          onClick={() => setSelectedFolderId(folder._id)}
                          className={`w-full p-3 rounded-lg border-2 text-right transition-all ${
                            selectedFolderId === folder._id
                              ? 'border-teal-400 bg-teal-100 dark:bg-teal-100'
                              : 'border-gray-200 dark:border-gray-700 hover:border-teal-400'
                          }`}
                          data-testid={`folder-${folder._id}`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: folder.color }}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{folder.name}</p>
                              {folder.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {folder.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
              <Button
                onClick={() => setShowNewFolder(true)}
                variant="outline"
                className="w-full"
                data-testid="button-new-folder"
              >
                <Plus className="h-4 w-4 ml-2" />
                إنشاء مجلد جديد
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="folder-name">اسم المجلد</Label>
                <Input
                  id="folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="مثلاً: الأخطاء الشائعة"
                  data-testid="input-folder-name"
                />
              </div>
              <div>
                <Label htmlFor="folder-description">الوصف (اختياري)</Label>
                <Input
                  id="folder-description"
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  placeholder="وصف المجلد"
                  data-testid="input-folder-description"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateFolder}
                  disabled={createFolderMutation.isPending}
                  className="flex-1"
                  data-testid="button-create-folder"
                >
                  {createFolderMutation.isPending ? "جاري الإنشاء..." : "إنشاء"}
                </Button>
                <Button
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                    setNewFolderDescription("");
                  }}
                  variant="outline"
                  data-testid="button-cancel-new-folder"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!showNewFolder && (
            <>
              <Button
                onClick={handleSave}
                disabled={!selectedFolderId || saveQuestionsMutation.isPending}
                data-testid="button-save-to-folder"
              >
                {saveQuestionsMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                data-testid="button-cancel"
              >
                إلغاء
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
