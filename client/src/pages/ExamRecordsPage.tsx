
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
import { BookText, Calculator, Clock, Award, Target } from 'lucide-react';

interface ExamRecord {
  date: string;
  examType: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
}

export default function ExamRecordsPage() {
  const [records, setRecords] = useState<ExamRecord[]>([]);

  useEffect(() => {
    const storedRecords = localStorage.getItem('examRecords');
    if (storedRecords) {
      setRecords(JSON.parse(storedRecords));
    }
  }, []);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">سجل الاختبارات</h1>
      
      <div className="grid gap-4">
        {records.length === 0 ? (
          <p className="text-center text-muted-foreground">لا يوجد سجلات اختبارات حتى الآن</p>
        ) : (
          records.map((record, index) => (
            <Card 
              key={index}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-gradient-to-br from-background/90 to-background relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent group-hover:via-primary/10 transition-all duration-500" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {record.examType === "verbal" ? 
                    <BookText className="h-5 w-5 text-blue-500" /> : 
                  record.examType === "quantitative" ?
                    <Calculator className="h-5 w-5 text-purple-500" /> :
                  record.examType === "qualification" ?
                    <Award className="h-5 w-5 text-amber-500" /> :
                    <Target className="h-5 w-5 text-green-500" />
                  }
                  {record.examType === "verbal" ? "اختبار لفظي" :
                   record.examType === "quantitative" ? "اختبار كمي" :
                   record.examType === "qualification" ? "اختبار تأهيلي" :
                   "اختبار قدرات"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm relative z-10">
                  <div>
                    <p className="text-muted-foreground">التاريخ</p>
                    <p>{formatDate(record.date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الدرجة</p>
                    <p>{record.score} من {record.totalQuestions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">النسبة المئوية</p>
                    <p>{((record.score / record.totalQuestions) * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      الوقت المستغرق
                    </p>
                    <p>{Math.floor(record.timeTaken / 60)} دقيقة</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // تحميل الأسئلة من التخزين المحلي
                      const storageKey = `exam_data_${record.examType}_${new Date(record.date).getTime()}`;
                      const testData = localStorage.getItem(storageKey);
                      
                      // تحضير البيانات للتحميل
                      const downloadData = {
                        ...record,
                        questions: testData ? JSON.parse(testData).questions : [],
                        userAnswers: testData ? JSON.parse(testData).userAnswers : {},
                        date: formatDate(record.date)
                      };
                      
                      // إنشاء ملف للتحميل
                      const data = JSON.stringify(downloadData, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = window.URL.createObjectURL(blob);
                      
                      // إنشاء وتفعيل التحميل
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `اختبار-${record.examType}-${formatDate(record.date)}.json`;
                      document.body.appendChild(a);
                      a.click();
                      
                      // تنظيف
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }}
                  >
                    تحميل الأسئلة
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      localStorage.setItem('currentTestResult', JSON.stringify(record));
                      setLocation('/test-results');
                    }}
                  >
                    شاهد النتيجة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
