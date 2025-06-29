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
    console.log('TestResultsPage: Checking for stored result...');
    
    // Try multiple possible keys for stored results
    const possibleKeys = ['currentTestResult', 'testResult', 'lastTestResult'];
    let foundResult = null;
    
    for (const key of possibleKeys) {
      const storedResult = localStorage.getItem(key);
      console.log(`Checking key '${key}':`, storedResult);
      
      if (storedResult) {
        try {
          foundResult = JSON.parse(storedResult);
          console.log('Found result:', foundResult);
          break;
        } catch (error) {
          console.error(`Error parsing result from key '${key}':`, error);
        }
      }
    }
    
    if (foundResult) {
      setResult(foundResult);
    } else {
      console.warn('No test result found in localStorage');
      // Try to create a mock result from URL params or other sources
      const urlParams = new URLSearchParams(window.location.search);
      const score = urlParams.get('score');
      const total = urlParams.get('total');
      const examType = urlParams.get('examType');
      const timeTaken = urlParams.get('timeTaken');
      
      if (score && total && examType) {
        const mockResult: TestResult = {
          date: new Date().toISOString(),
          examType: examType,
          score: parseInt(score),
          totalQuestions: parseInt(total),
          timeTaken: timeTaken ? parseInt(timeTaken) : 0
        };
        console.log('Created mock result from URL params:', mockResult);
        setResult(mockResult);
      }
    }
  }, []);

  if (!result) {
    return (
      <div className="container py-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <Clock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          </div>
          <h2 className="text-xl font-bold mb-2">لا توجد نتيجة للعرض</h2>
          <p className="text-gray-600 mb-4">
            يبدو أن بيانات النتيجة غير متوفرة. قد يكون السبب:
          </p>
          <ul className="text-sm text-gray-500 mb-6 text-right">
            <li>• لم يتم إكمال الاختبار بشكل صحيح</li>
            <li>• انتهت صلاحية بيانات النتيجة</li>
            <li>• مشكلة تقنية مؤقتة</li>
          </ul>
          <div className="space-y-2">
            <Button 
              onClick={handleBackToRecords} 
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              العودة لسجل الاختبارات
            </Button>
            <Button 
              onClick={() => setLocation('/verbal-tests')} 
              variant="outline"
              className="w-full"
            >
              إجراء اختبار جديد
            </Button>
          </div>
        </div>
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