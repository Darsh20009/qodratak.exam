
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/formatters';

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
                    <BookIcon className="h-5 w-5 text-blue-500" /> : 
                    <Calculator className="h-5 w-5 text-purple-500" />
                  }
                  {record.examType}
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
                    <p className="text-muted-foreground">الوقت المستغرق</p>
                    <p>{Math.floor(record.timeTaken / 60)} دقيقة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
