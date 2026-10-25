import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, CheckCircle2, Timer } from 'lucide-react';

interface Question {
  id: number;
  category: string;
  text: string;
  options: string[];
  imageUrl?: string;
  imageUrls?: string[];
}

interface PaperExam {
  id: string;
  title: string;
  totalQuestions: number;
  trialQuestions: number;
  program: 'qudrat' | 'tahsili';
  subjectId?: string;
  timeLimit: number;
  status: string;
}

interface DownloadStepProps {
  exam: PaperExam;
  questions: Question[];
  generateExamHTML: () => void;
  generateBubbleSheetHTML: () => void;
  onProceed: () => void;
}

export default function DownloadStep({
  exam,
  questions,
  generateExamHTML,
  generateBubbleSheetHTML,
  onProceed,
}: DownloadStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            تنزيل ملفات الاختبار
          </CardTitle>
          <CardDescription>
            قم بتنزيل ملف الاختبار وورقة الإجابة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">تم إنشاء الاختبار بنجاح</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              {exam.title} • {exam.totalQuestions} سؤال • {exam.timeLimit} دقيقة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">ملف الاختبار</CardTitle>
                <CardDescription>ملف  pdf  يحتوي على جميع الأسئلة</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generateExamHTML}
                  className="w-full"
                  size="lg"
                  data-testid="button-download-exam"
                  disabled={!questions.length}
                >
                  <Download className="w-4 h-4 ml-2" />
                  تنزيل ملف الاختبار
                </Button>
                {!questions.length && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    جاري تحميل الأسئلة...
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">ورقة الإجابة</CardTitle>
                <CardDescription>
                  ورقة bubble sheet للإجابة على الأسئلة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generateBubbleSheetHTML}
                  className="w-full"
                  size="lg"
                  variant="outline"
                  data-testid="button-download-answer-sheet"
                >
                  <FileText className="w-4 h-4 ml-2" />
                  تنزيل ورقة الإجابة
                </Button>
              </CardContent>
            </Card>

          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-6 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-3">
              <Timer className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100">ابدأ الحل</h3>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200 mb-4">
              تُحفظ إجاباتك بأمان وتُصحح على الخادم بعد التسليم. لن يظهر مفتاح الإجابة قبل إنهاء الاختبار.
            </p>
            <Button onClick={onProceed} size="lg" className="w-full" data-testid="button-start-timed-exam">
              <Timer className="w-5 h-5 ml-2" />
              ابدأ الاختبار المحدد بوقت
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
