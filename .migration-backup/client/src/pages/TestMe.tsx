import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  GraduationCap,
  Folder, 
  PlayCircle,
  CheckCircle,
  Clock,
  BookOpen,
  TrendingUp,
  Award
} from "lucide-react";
import { useLocation } from "wouter";

export default function TestMe() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [isStarting, setIsStarting] = useState(false);

  const { data: user } = useQuery<any>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: folders = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/folders/user', user?.id],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user?.id,
  });

  // Get URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const folderParam = params.get('folder');
    if (folderParam) {
      setSelectedFolders([folderParam]);
    }
  }, []);

  const [foldersData, setFoldersData] = useState<any[]>([]);

  useEffect(() => {
    const loadFoldersData = async () => {
      if (!folders.length) return;
      
      const data = await Promise.all(
        folders.map(async (folder: any) => {
          try {
            const questions = await fetch(`/api/folders/${folder._id}/questions`)
              .then(res => res.json());
            return { ...folder, questionCount: questions.length };
          } catch {
            return { ...folder, questionCount: 0 };
          }
        })
      );
      setFoldersData(data);
    };
    
    loadFoldersData();
  }, [folders]);

  const toggleFolder = (folderId: string) => {
    setSelectedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const totalAvailableQuestions = foldersData
    .filter(f => selectedFolders.includes(f._id))
    .reduce((sum, f) => sum + f.questionCount, 0);

  const handleStartTest = async () => {
    if (selectedFolders.length === 0) {
      toast({
        title: "⚠️ خطأ",
        description: "يرجى اختيار مجلد واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (totalAvailableQuestions === 0) {
      toast({
        title: "⚠️ خطأ",
        description: "المجلدات المختارة لا تحتوي على أسئلة",
        variant: "destructive",
      });
      return;
    }

    setIsStarting(true);

    try {
      // جلب جميع الأسئلة من المجلدات المختارة
      const allQuestions = [];
      for (const folderId of selectedFolders) {
        const questions = await fetch(`/api/folders/${folderId}/questions`)
          .then(res => res.json());
        allQuestions.push(...questions);
      }

      // إزالة التكرارات (نفس السؤال في أكثر من مجلد)
      const uniqueQuestions = allQuestions.filter((q, index, self) => 
        self.findIndex(t => t.id === q.id) === index
      );

      // خلط الأسئلة عشوائياً
      const shuffled = uniqueQuestions.sort(() => Math.random() - 0.5);
      
      // اختيار عدد الأسئلة المطلوب
      const selectedQuestions = shuffled.slice(0, Math.min(questionCount, uniqueQuestions.length));

      if (selectedQuestions.length === 0) {
        toast({
          title: "⚠️ خطأ",
          description: "لا توجد أسئلة متاحة للاختبار",
          variant: "destructive",
        });
        setIsStarting(false);
        return;
      }

      // حفظ الأسئلة في localStorage
      localStorage.setItem('folder_test_questions', JSON.stringify(selectedQuestions));
      localStorage.setItem('folder_test_config', JSON.stringify({
        folderIds: selectedFolders,
        totalQuestions: selectedQuestions.length,
        type: 'folder_practice'
      }));

      // الانتقال إلى صفحة الاختبار
      navigate('/folder-test');
    } catch (error) {
      console.error('Error starting test:', error);
      toast({
        title: "❌ خطأ",
        description: "حدث خطأ أثناء بدء الاختبار",
        variant: "destructive",
      });
      setIsStarting(false);
    }
  };

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
            <p className="text-gray-600 dark:text-gray-400 mb-4">يرجى تسجيل الدخول للوصول إلى اختبرني</p>
            <Button onClick={() => navigate('/login')} data-testid="button-login">
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-teal-700" />
          اختبرني
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          اختبر نفسك من الأسئلة المحفوظة في مجلداتك
        </p>
      </div>

      {foldersData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد مجلدات بعد
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ابدأ بحفظ بعض الأسئلة في مجلدات لاستخدام ميزة "اختبرني"
            </p>
            <Button onClick={() => navigate('/folders')} className="bg-teal-100 hover:bg-teal-100" data-testid="button-go-folders">
              اذهب إلى المجلدات
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* الجانب الأيمن: اختيار المجلدات */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  اختر المجلدات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {foldersData.map((folder) => (
                  <div
                    key={folder._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedFolders.includes(folder._id)
                        ? 'border-teal-400 bg-teal-100 dark:bg-teal-100'
                        : 'border-gray-200 dark:border-gray-700 hover:border-teal-400'
                    }`}
                    onClick={() => toggleFolder(folder._id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedFolders.includes(folder._id)}
                        onCheckedChange={() => toggleFolder(folder._id)}
                        data-testid={`checkbox-folder-${folder._id}`}
                      />
                      <div
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
                      >
                        <Folder className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{folder.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {folder.questionCount} سؤال
                        </p>
                      </div>
                      {selectedFolders.includes(folder._id) && (
                        <CheckCircle className="h-5 w-5 text-teal-700" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {selectedFolders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    عدد الأسئلة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-teal-700">
                      {Math.min(questionCount, totalAvailableQuestions)}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      من أصل {totalAvailableQuestions}
                    </span>
                  </div>
                  <Slider
                    value={[questionCount]}
                    onValueChange={(value) => setQuestionCount(value[0])}
                    min={1}
                    max={Math.max(totalAvailableQuestions, 1)}
                    step={1}
                    className="w-full"
                    data-testid="slider-question-count"
                  />
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>1 سؤال</span>
                    <span>{totalAvailableQuestions} سؤال</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* الجانب الأيسر: ملخص وبدء الاختبار */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-teal-600 to-blue-600 text-white">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-90" />
                  <h3 className="text-xl font-bold mb-2">جاهز للاختبار؟</h3>
                  <p className="text-sm opacity-90">
                    راجع أداءك واختبر معلوماتك
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                    <span className="text-sm">المجلدات المختارة</span>
                    <span className="font-bold">{selectedFolders.length}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                    <span className="text-sm">عدد الأسئلة</span>
                    <span className="font-bold">
                      {selectedFolders.length > 0 
                        ? Math.min(questionCount, totalAvailableQuestions)
                        : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                    <span className="text-sm">الوقت المقدر</span>
                    <span className="font-bold">
                      {Math.ceil(Math.min(questionCount, totalAvailableQuestions) * 1.5)} دقيقة
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleStartTest}
                  disabled={selectedFolders.length === 0 || isStarting}
                  className="w-full bg-white text-teal-700 hover:bg-gray-100 font-bold"
                  size="lg"
                  data-testid="button-start-test"
                >
                  {isStarting ? (
                    <>جاري التحضير...</>
                  ) : (
                    <>
                      <PlayCircle className="h-5 w-5 ml-2" />
                      ابدأ الاختبار
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0 text-teal-700" />
                    <p>راجع الأسئلة من مجلداتك المختارة</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0 text-teal-700" />
                    <p>تابع تقدمك وحسّن أداءك</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Award className="h-4 w-4 mt-0.5 flex-shrink-0 text-teal-700" />
                    <p>اكسب نقاط عند إتمام الاختبار</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
