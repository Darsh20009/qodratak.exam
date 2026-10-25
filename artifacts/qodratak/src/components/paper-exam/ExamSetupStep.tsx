import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { FileText, AlertCircle } from 'lucide-react';

interface PaperExam {
  id: string;
  title: string;
  totalQuestions: number;
  trialQuestions: number;
  program: 'qudrat' | 'tahsili';
  subjectId?: string;
  distribution: string;
  timeLimit: number;
  status: string;
  startedAt: string;
  expiresAt: string;
}

interface CreatedPaperExam {
  exam: PaperExam;
  questions: Array<{
    id: number;
    category: string;
    text: string;
    options: string[];
    imageUrl?: string;
    imageUrls?: string[];
    isTrial: boolean;
  }>;
  answers: Record<string, number>;
  reviewQuestionNumbers: number[];
}

interface ExamSetupStepProps {
  onExamCreated: (attempt: CreatedPaperExam) => void;
}

export default function ExamSetupStep({ onExamCreated }: ExamSetupStepProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    totalQuestions: 120,
    trialQuestions: 20,
    program: 'qudrat' as 'qudrat' | 'tahsili',
    subjectId: 'رياضيات',
    timeLimitMinutes: 120,
    distribution: 'mixed',
    verbalCount: 60,
    quantitativeCount: 60,
  });

  const createExamMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/paper-exams', data);
      if (!response.ok) throw new Error('تعذر إنشاء الاختبار');
      return await response.json();
    },
    onSuccess: (attempt: CreatedPaperExam) => {
      onExamCreated(attempt);
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل إنشاء الاختبار',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال عنوان الاختبار',
        variant: 'destructive',
      });
      return;
    }

    createExamMutation.mutate(formData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          إعداد الاختبار
        </CardTitle>
        <CardDescription>
          قم بإعداد الاختبار الورقي الخاص بك
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الاختبار *</Label>
            <Input
              id="title"
              data-testid="input-exam-title"
              placeholder="مثال: اختبار قدرات تجريبي"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program">البرنامج</Label>
              <Select
                value={formData.program}
                onValueChange={(value: 'qudrat' | 'tahsili') => setFormData({ ...formData, program: value })}
              >
                <SelectTrigger id="program" data-testid="select-exam-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qudrat" data-testid="select-option-qudrat">قدرات</SelectItem>
                  <SelectItem value="tahsili" data-testid="select-option-tahsili">تحصيلي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.program === 'qudrat' ? (
              <div className="space-y-2">
                <Label htmlFor="distribution">توزيع الأسئلة</Label>
                <Select
                  value={formData.distribution}
                  onValueChange={(value) => setFormData({ ...formData, distribution: value })}
                >
                  <SelectTrigger id="distribution"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">مختلط (كمي ولفظي)</SelectItem>
                    <SelectItem value="verbal">لفظي فقط</SelectItem>
                    <SelectItem value="quantitative">كمي فقط</SelectItem>
                    <SelectItem value="custom">تخصيص يدوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="subjectId">المادة التحصيلية</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                >
                  <SelectTrigger id="subjectId"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="رياضيات">رياضيات</SelectItem>
                    <SelectItem value="فيزياء">فيزياء</SelectItem>
                    <SelectItem value="كيمياء">كيمياء</SelectItem>
                    <SelectItem value="أحياء">أحياء</SelectItem>
                    <SelectItem value="علم الأرض">علم الأرض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="totalQuestions">عدد الأسئلة</Label>
              <Input
                id="totalQuestions"
                data-testid="input-total-questions"
                type="number"
                min="10"
                max="200"
                value={formData.totalQuestions}
                onChange={(e) => setFormData({ ...formData, totalQuestions: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trialQuestions">عدد أسئلة التجربة</Label>
              <Input
                id="trialQuestions"
                data-testid="input-trial-questions"
                type="number"
                min="0"
                max="50"
                value={formData.trialQuestions}
                onChange={(e) => setFormData({ ...formData, trialQuestions: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeLimitMinutes">المدة الزمنية (بالدقائق)</Label>
              <Input
                id="timeLimitMinutes"
                data-testid="input-time-limit"
                type="number"
                min="30"
                max="300"
                value={formData.timeLimitMinutes}
                onChange={(e) => setFormData({ ...formData, timeLimitMinutes: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {formData.program === 'qudrat' && formData.distribution === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="space-y-2">
                <Label htmlFor="verbalCount" className="text-blue-700 dark:text-blue-300 font-semibold">
                  عدد الأسئلة اللفظية
                </Label>
                <Input
                  id="verbalCount"
                  type="number"
                  min="0"
                  max={formData.totalQuestions}
                  value={formData.verbalCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setFormData({ 
                      ...formData, 
                      verbalCount: val,
                      quantitativeCount: formData.totalQuestions - val 
                    });
                  }}
                  className="border-blue-300 dark:border-blue-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantitativeCount" className="text-green-700 dark:text-green-300 font-semibold">
                  عدد الأسئلة الكمية
                </Label>
                <Input
                  id="quantitativeCount"
                  type="number"
                  min="0"
                  max={formData.totalQuestions}
                  value={formData.quantitativeCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setFormData({ 
                      ...formData, 
                      quantitativeCount: val,
                      verbalCount: formData.totalQuestions - val 
                    });
                  }}
                  className="border-green-300 dark:border-green-700"
                />
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">ملاحظة:</p>
              <p>
                سيتم إنشاء اختبار ورقي كامل مع ورقة الإجابة. يمكنك تنزيل الملفات وطباعتها،
                ثم إدخال الإجابات يدوياً للحصول على النتيجة.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              data-testid="button-create-exam"
              disabled={createExamMutation.isPending}
              size="lg"
            >
              {createExamMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الاختبار'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
