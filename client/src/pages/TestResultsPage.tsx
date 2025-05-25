import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Trophy, Clock, BookText, Calculator } from 'lucide-react';

interface TestResult {
  date: string;
  examType: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
}

export default function TestResultsPage() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<TestResult | null>(null);

  const handleBackToRecords = () => {
    console.log('Navigating to records...');
    setLocation('/records');
  };

  useEffect(() => {
    const storedResult = localStorage.getItem('currentTestResult');
    if (storedResult) {
      setResult(JSON.parse(storedResult));
    }
  }, []);

  if (!result) {
    return (
      <div className="container py-8 text-center">
        <p>لا توجد نتيجة للعرض</p>
        <Button 
          onClick={handleBackToRecords} 
          className="mt-4 bg-primary hover:bg-primary/90 text-white"
        >
          العودة لسجل الاختبارات
        </Button>
      </div>
    );
  }

  const percentage = (result.score / result.totalQuestions) * 100;

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <Card className="overflow-hidden">
        <div className={`h-2 ${percentage >= 70 ? "bg-green-500" : percentage >= 50 ? "bg-yellow-500" : "bg-red-500"}`} />
        <CardHeader className="text-center">
          <div className="mb-2">
            <Trophy className={`h-12 w-12 mx-auto ${
              percentage >= 70 ? "text-yellow-500" : 
              percentage >= 50 ? "text-blue-500" : "text-gray-400"
            }`} />
          </div>
          <CardTitle className="text-2xl">نتيجة الاختبار</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-5xl font-bold mb-2">{result.score}/{result.totalQuestions}</div>
            <div className="text-2xl mb-2 text-primary">النسبة: {percentage.toFixed(1)}%</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-1">نوع الاختبار</div>
              <div className="font-bold flex items-center justify-center gap-2">
                {result.examType === "verbal" ? (
                  <><BookText className="h-4 w-4 text-blue-500" /> لفظي</>
                ) : (
                  <><Calculator className="h-4 w-4 text-purple-500" /> كمي</>
                )}
              </div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-1">الوقت المستغرق</div>
              <div className="font-bold flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                {Math.floor(result.timeTaken / 60)} دقيقة
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={handleBackToRecords}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              العودة لسجل الاختبارات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}