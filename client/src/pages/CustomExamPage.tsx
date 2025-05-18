import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CheckIcon,
  ClipboardList,
  Clock3,
  FolderIcon,
  Settings,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserCustomExamConfig, TestType, TestDifficulty } from "@shared/types";
import { Checkbox } from "@/components/ui/checkbox";

// Schema for custom exam creation
const customExamSchema = z.object({
  name: z.string().min(3, {
    message: "يجب أن يكون اسم الاختبار أكثر من 3 حروف",
  }),
  description: z.string().optional(),
  questionCount: z.coerce.number().min(5).max(100),
  timeLimit: z.coerce.number().min(5).max(120),
  categories: z.array(z.string()).min(1, {
    message: "يجب اختيار نوع واحد على الأقل من الأسئلة",
  }),
  difficulty: z.string(),
  folderName: z.string().optional(),
  saveToFolder: z.boolean().default(false),
});

type FormValues = z.infer<typeof customExamSchema>;

const CustomExamPage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<"basic" | "advanced">("basic");
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(customExamSchema),
    defaultValues: {
      name: "اختباري المخصص",
      description: "اختبار شخصي مخصص",
      questionCount: 20,
      timeLimit: 20,
      categories: ["verbal"],
      difficulty: "beginner",
      saveToFolder: false,
      folderName: "",
    },
  });
  
  const watchSaveToFolder = form.watch("saveToFolder");
  
  // Calculate time per question
  const questionCount = form.watch("questionCount");
  const timeLimit = form.watch("timeLimit");
  const timePerQuestion = questionCount > 0 ? (timeLimit / questionCount).toFixed(1) : "0";
  
  const onSubmit = async (data: FormValues) => {
    try {
      // Create a custom exam configuration
      const examConfig: UserCustomExamConfig = {
        userId: 1,
        name: data.name,
        description: data.description,
        questionCount: data.questionCount,
        timeLimit: data.timeLimit,
        categories: data.categories as TestType[],
        difficulty: data.difficulty as TestDifficulty,
      };
      
      // Send to API
      const response = await fetch('/api/custom-exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(examConfig),
      });

      if (!response.ok) {
        throw new Error('فشل في إنشاء الاختبار');
      }

      const result = await response.json();
      
      toast({
        title: "تم إنشاء الاختبار بنجاح",
        description: `تم إنشاء اختبار "${data.name}" ويمكنك البدء الآن.`,
      });
      
      // Navigate to the custom exam page with the created exam ID
      setLocation(`/custom-exam/${result.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء الاختبار",
        description: "حدث خطأ أثناء إنشاء الاختبار. الرجاء المحاولة مرة أخرى.",
      });
    }
  };
  
  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">إنشاء اختبار مخصص</h1>
      <p className="text-muted-foreground mb-8">
        قم بإنشاء اختبار مخصص حسب احتياجاتك، باختيار عدد الأسئلة ونوعها والوقت المخصص لها.
      </p>
      
      <Card>
        <CardHeader>
          <CardTitle>إعدادات الاختبار</CardTitle>
          <CardDescription>قم بتخصيص اختبارك الشخصي</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" onValueChange={(value) => setTab(value as "basic" | "advanced")}>
            <TabsList className="mb-6">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                إعدادات أساسية
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                إعدادات متقدمة
              </TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TabsContent value="basic" className="space-y-6">
                  {/* Basic exam details */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الاختبار</FormLabel>
                        <FormControl>
                          <Input placeholder="اختباري المخصص" {...field} />
                        </FormControl>
                        <FormDescription>
                          سيظهر هذا الاسم في قائمة الاختبارات الخاصة بك
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="questionCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عدد الأسئلة</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-4">
                              <Slider 
                                defaultValue={[20]} 
                                min={5} 
                                max={100}
                                step={5}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                {...field}
                                className="w-20"
                                min={5}
                                max={100}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            اختر عدد الأسئلة من 5 إلى 100 سؤال
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="timeLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الوقت المخصص (بالدقائق)</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-4">
                              <Slider 
                                defaultValue={[20]} 
                                min={5} 
                                max={120}
                                step={5}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                {...field}
                                className="w-20"
                                min={5}
                                max={120}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            معدل الوقت لكل سؤال: {timePerQuestion} دقيقة
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="categories"
                    render={() => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel>نوع الأسئلة</FormLabel>
                          <FormDescription>
                            اختر نوع واحد أو أكثر من الأسئلة
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="categories"
                            render={({ field }) => {
                              return (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 space-x-reverse rounded-md border p-4">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes("verbal")}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || [];
                                        const newValue = checked
                                          ? [...currentValues, "verbal"]
                                          : currentValues.filter((value) => value !== "verbal");
                                        field.onChange(newValue);
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>قدرات لفظية</FormLabel>
                                    <FormDescription>
                                      أسئلة متعلقة باللغة والفهم القرائي
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                          
                          <FormField
                            control={form.control}
                            name="categories"
                            render={({ field }) => {
                              return (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 space-x-reverse rounded-md border p-4">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes("quantitative")}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || [];
                                        const newValue = checked
                                          ? [...currentValues, "quantitative"]
                                          : currentValues.filter((value) => value !== "quantitative");
                                        field.onChange(newValue);
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>قدرات كمية</FormLabel>
                                    <FormDescription>
                                      أسئلة متعلقة بالرياضيات والمنطق
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مستوى الصعوبة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر مستوى الصعوبة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">مبتدئ</SelectItem>
                            <SelectItem value="intermediate">متوسط</SelectItem>
                            <SelectItem value="advanced">متقدم</SelectItem>
                            <SelectItem value="expert">خبير</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          يؤثر مستوى الصعوبة على نوعية الأسئلة المقدمة
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-6">
                  {/* Advanced options */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وصف الاختبار</FormLabel>
                        <FormControl>
                          <Input placeholder="وصف اختياري للاختبار" {...field} />
                        </FormControl>
                        <FormDescription>
                          وصف اختياري يوضح الغرض من الاختبار
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="saveToFolder"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 space-x-reverse rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>حفظ الأسئلة في مجلد</FormLabel>
                          <FormDescription>
                            حفظ الأسئلة في مجلد خاص للمراجعة لاحقًا
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {watchSaveToFolder && (
                    <FormField
                      control={form.control}
                      name="folderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المجلد</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input placeholder="اسم المجلد" {...field} />
                            </FormControl>
                            <Button variant="outline">
                              <FolderIcon className="h-4 w-4 ml-2" />
                              إنشاء
                            </Button>
                          </div>
                          <FormDescription>
                            سيتم إنشاء مجلد بهذا الاسم لحفظ الأسئلة فيه
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>
                
                <div className={cn("flex justify-between", tab === "basic" ? "mt-6" : "")}>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setLocation("/")}
                  >
                    إلغاء
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {tab === "basic" ? (
                      <Button 
                        type="button" 
                        onClick={() => setTab("advanced")}
                        variant="outline"
                      >
                        الإعدادات المتقدمة
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        onClick={() => setTab("basic")}
                        variant="outline"
                      >
                        العودة للإعدادات الأساسية
                      </Button>
                    )}
                    
                    <Button type="submit">
                      إنشاء الاختبار
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Quick preview of exam configuration */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">معاينة الاختبار</CardTitle>
          <CardDescription>نظرة سريعة على إعدادات الاختبار المخصص</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">عدد الأسئلة</div>
                <div className="text-2xl font-bold">{questionCount}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Clock3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">الوقت المخصص</div>
                <div className="text-2xl font-bold">{timeLimit} دقيقة</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <CheckIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">أنواع الأسئلة</div>
                <div className="text-lg font-medium">
                  {form.watch("categories").includes("verbal") && "لفظي "}
                  {form.watch("categories").includes("verbal") && form.watch("categories").includes("quantitative") && "و "}
                  {form.watch("categories").includes("quantitative") && "كمي"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomExamPage;