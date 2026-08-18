import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, CheckCircle2, ArrowRight, Timer, Zap } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState } from 'react';

interface Question {
  id: number;
  category: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

interface PaperExam {
  id: number;
  title: string;
  totalQuestions: number;
  trialQuestions: number;
  examType: string;
  timeLimit: number;
  status: string;
}

interface DownloadStepProps {
  exam: PaperExam;
  questions: Question[];
  generateExamHTML: () => void;
  generateBubbleSheetHTML: () => void;
  generateBubbleSheetWithAnswers: () => void;
  generateQuickCorrectionHTML?: (correctCount: number, verbalCorrect?: number, quantCorrect?: number) => void;
  onProceed: () => void;
}

export default function DownloadStep({
  exam,
  questions,
  generateExamHTML,
  generateBubbleSheetHTML,
  generateBubbleSheetWithAnswers,
  generateQuickCorrectionHTML,
  onProceed,
}: DownloadStepProps) {
  const [, setLocation] = useLocation();
  const [correctCount, setCorrectCount] = useState<string>('');
  // 🎯 نظام التصحيح السريع المتقدم - إدخال منفصل للفظي والكمي
  const [verbalCorrect, setVerbalCorrect] = useState<string>('');
  const [quantCorrect, setQuantCorrect] = useState<string>('');
  
  const trialCount = exam.trialQuestions || 0;
  const scoredCount = exam.totalQuestions - trialCount;
  
  // حساب عدد الأسئلة اللفظية والكمية
  const verbalTotal = questions.filter(q => 
    (q.category === 'verbal' || q.category === 'لفظي')
  ).length;
  const quantTotal = questions.filter(q => 
    (q.category === 'quantitative' || q.category === 'كمي')
  ).length;

  const handleStartTimedExam = () => {
    // حفظ بيانات الاختبار في localStorage
    localStorage.setItem('paperExamData', JSON.stringify({
      title: exam.title,
      timeLimit: exam.timeLimit,
      questions: questions
    }));
    
    // الانتقال إلى صفحة النتائج
    setLocation('/paper-exam-results');
  };
  
  const handleQuickCorrection = () => {
    const count = parseInt(correctCount);
    if (isNaN(count) || count < 0 || count > scoredCount) {
      alert(`الرجاء إدخال عدد صحيح من 0 إلى ${scoredCount}`);
      return;
    }
    if (generateQuickCorrectionHTML) {
      generateQuickCorrectionHTML(count);
    }
  };
  
  // 🎯 نظام التصحيح المتقدم - إدخال منفصل
  const handleAdvancedCorrection = () => {
    const vCorrect = parseInt(verbalCorrect);
    const qCorrect = parseInt(quantCorrect);
    
    if (isNaN(vCorrect) || vCorrect < 0 || vCorrect > verbalTotal) {
      alert(`الرجاء إدخال عدد صحيح للفظي من 0 إلى ${verbalTotal}`);
      return;
    }
    if (isNaN(qCorrect) || qCorrect < 0 || qCorrect > quantTotal) {
      alert(`الرجاء إدخال عدد صحيح للكمي من 0 إلى ${quantTotal}`);
      return;
    }
    
    const totalCorrect = vCorrect + qCorrect;
    if (generateQuickCorrectionHTML) {
      // تمرير الأرقام منفصلة للحصول على تقرير مفصل
      generateQuickCorrectionHTML(totalCorrect, vCorrect, qCorrect);
    }
  };

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <Card className="border-2 border-green-300 dark:border-green-700">
              <CardHeader>
                <CardTitle className="text-lg text-green-600 dark:text-green-400">ورقة الإجابة المحلولة</CardTitle>
                <CardDescription>
                  ورقة bubble sheet مع الإجابات الصحيحة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generateBubbleSheetWithAnswers}
                  className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                  size="lg"
                  data-testid="button-download-answer-key"
                  disabled={!questions.length}
                >
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  تنزيل مفتاح الإجابة
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 🎯 نظام التصحيح السريع المتقدم - إدخال منفصل للفظي والكمي */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-6 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">🎯 التصحيح السريع المتقدم (موصى به!)</h3>
            </div>
            <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4">
              أدخل عدد الصحيح من اللفظي والكمي منفصلين للحصول على تقرير دقيق ومفصل!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-semibold text-red-600 dark:text-red-400 block mb-2">
                  🔴 عدد الصحيح من اللفظي:
                </label>
                <Input
                  type="number"
                  min="0"
                  max={verbalTotal}
                  value={verbalCorrect}
                  onChange={(e) => setVerbalCorrect(e.target.value)}
                  placeholder={`0 - ${verbalTotal}`}
                  className="text-lg border-2 border-red-300"
                  data-testid="input-verbal-correct"
                />
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  من أصل {verbalTotal} سؤال لفظي
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-green-600 dark:text-green-400 block mb-2">
                  🟢 عدد الصحيح من الكمي:
                </label>
                <Input
                  type="number"
                  min="0"
                  max={quantTotal}
                  value={quantCorrect}
                  onChange={(e) => setQuantCorrect(e.target.value)}
                  placeholder={`0 - ${quantTotal}`}
                  className="text-lg border-2 border-green-300"
                  data-testid="input-quant-correct"
                />
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  من أصل {quantTotal} سؤال كمي
                </p>
              </div>
            </div>
            <Button
              onClick={handleAdvancedCorrection}
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              data-testid="button-advanced-correction"
              disabled={!verbalCorrect || !quantCorrect || !generateQuickCorrectionHTML}
            >
              <Zap className="w-5 h-5 ml-2" />
              إنشاء التقرير المتقدم
            </Button>
          </div>
          
          {/* التصحيح السريع العادي */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 p-6 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100">⚡ التصحيح السريع العادي</h3>
            </div>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
              أدخل عدد الأسئلة الصحيحة فقط (بدون الأسئلة التجريبية)، وسنحسب النسبة تلقائياً!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 block mb-2">
                  عدد الأسئلة الصحيحة (من {scoredCount} سؤال):
                </label>
                <Input
                  type="number"
                  min="0"
                  max={scoredCount}
                  value={correctCount}
                  onChange={(e) => setCorrectCount(e.target.value)}
                  placeholder={`0 - ${scoredCount}`}
                  className="text-lg"
                  data-testid="input-correct-count"
                />
                {trialCount > 0 && (
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    ⚠️ لا تحسب الأسئلة التجريبية ({trialCount} سؤال موزع عبر الاختبار)
                  </p>
                )}
              </div>
              <Button
                onClick={handleQuickCorrection}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                data-testid="button-quick-correction"
                disabled={!correctCount || !generateQuickCorrectionHTML}
              >
                <Zap className="w-5 h-5 ml-2" />
                إنشاء التقرير
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-6 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-3">
              <Timer className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100">طريقة التصحيح التقليدية</h3>
            </div>
            <p className="text-sm text-green-800 dark:text-green-200 mb-4">
              جرب الطريقة التقليدية مع <strong>حاسبة الوقت المباشرة</strong>! احل الاختبار الورقي، ثم أدخل إجاباتك مباشرة من ورقة الإجابة المحلولة.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleStartTimedExam}
                size="lg"
                className="flex-1 bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-700 hover:to-amber-700 text-white"
                data-testid="button-start-timed-exam"
              >
                <Timer className="w-5 h-5 ml-2" />
                ابدأ الاختبار مع حاسبة الوقت
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
