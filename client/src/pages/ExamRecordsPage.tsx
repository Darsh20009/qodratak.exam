import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters'; // تأكد من أن هذا المسار صحيح
import {
  BookText,
  Calculator,
  Clock,
  Award,
  Target,
  Eye,
  CheckCircle,
  XCircle,
  BarChart3,
  Filter,
  ArrowUpDown,
  ListChecks,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // تأكد من أن هذا المسار صحيح
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // تأكد من أن هذا المسار صحيح ومكون Select مُعد

interface ExamRecord {
  date: string;
  examType: string; // اسم الاختبار الكامل
  score: number;
  totalQuestions: number;
  timeTaken: number; // بالدقائق
}

// دالة مساعدة لتحديد لون بناءً على النسبة المئوية
const getScoreColor = (score: number, totalQuestions: number): string => {
  if (totalQuestions === 0) return 'text-slate-500';
  const percentage = (score / totalQuestions) * 100;
  if (percentage >= 80) return 'text-green-600 dark:text-green-400';
  if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

// دالة مساعدة لتحديد أيقونة بناءً على النسبة المئوية
const getScoreIcon = (score: number, totalQuestions: number): JSX.Element => {
  if (totalQuestions === 0) return <XCircle className="h-5 w-5 inline-block mr-1 text-slate-500" />;
  const percentage = (score / totalQuestions) * 100;
  if (percentage >= 60) return <CheckCircle className="h-5 w-5 inline-block mr-1" />;
  return <XCircle className="h-5 w-5 inline-block mr-1" />;
};

// دالة مساعدة لتنسيق الوقت (الوقت الآن بالدقائق)
const formatTimeTakenDisplay = (minutes: number): string => {
  if (minutes <= 0) return "دقائق قليلة";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  let result = "";
  if (hrs > 0) {
    result += `${hrs} ساعة`;
    if (mins > 0) result += " و ";
  }
  if (mins > 0) {
    result += `${mins} دقيقة`;
  }
  return result || `${Math.round(minutes)} دقيقة`;
};

// دالة لاستنتاج نوع الاختبار وعرضه بشكل مميز
const getInferredExamTypeDisplay = (examName: string) => {
  const lowerExamName = examName.toLowerCase();
  if (lowerExamName.includes("لفظي") || lowerExamName.includes("verbal")) {
    return { icon: <BookText className="h-6 w-6 text-blue-500" />, name: examName, color: "blue", category: "اختبار لفظي" };
  }
  if (lowerExamName.includes("كمي") || lowerExamName.includes("quantitative")) {
    return { icon: <Calculator className="h-6 w-6 text-purple-500" />, name: examName, color: "purple", category: "اختبار كمي" };
  }
  if (lowerExamName.includes("تأهيلي") || lowerExamName.includes("qualification")) {
    return { icon: <Award className="h-6 w-6 text-amber-500" />, name: examName, color: "amber", category: "اختبار تأهيلي" };
  }
  if (lowerExamName.includes("قياس") || lowerExamName.includes("قدرات") || lowerExamName.includes("qiyas")) {
    return { icon: <ListChecks className="h-6 w-6 text-teal-500" />, name: examName, color: "teal", category: "اختبار قدرات/قياس" };
  }
  return { icon: <Target className="h-6 w-6 text-emerald-500" />, name: examName, color: "emerald", category: "اختبار عام" };
};

export default function CreativeExamRecordsPage() {
  const [allRecords, setAllRecords] = useState<ExamRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ExamRecord[]>([]);
  const [_location, setLocation] = useLocation();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"date_desc" | "date_asc" | "score_desc" | "score_asc">("date_desc");

  useEffect(() => {
    const storedRecords = localStorage.getItem('examRecords');
    if (storedRecords) {
      try {
        const parsedRecords = JSON.parse(storedRecords) as ExamRecord[];
        const validRecords = parsedRecords.filter(
          r =>
            r &&
            typeof r.date === 'string' &&
            typeof r.examType === 'string' &&
            typeof r.score === 'number' &&
            typeof r.totalQuestions === 'number' && r.totalQuestions >=0 &&
            typeof r.timeTaken === 'number' && r.timeTaken >= 0
        );
        setAllRecords(validRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        console.error("Failed to parse exam records:", error);
        toast({
          title: "خطأ في تحميل السجلات",
          description: "تم العثور على بيانات تالفة. قد تحتاج لمسح بيانات الموقع والمحاولة مجدداً.",
          variant: "destructive",
        });
        setAllRecords([]);
      }
    }
  }, [toast]);

  useEffect(() => {
    let recordsToProcess = [...allRecords];

    if (filterType !== "all") {
      recordsToProcess = recordsToProcess.filter(record => record.examType === filterType);
    }

    recordsToProcess.sort((a, b) => {
      switch (sortOrder) {
        case "date_asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "score_desc":
          const percentageB = b.totalQuestions > 0 ? (b.score / b.totalQuestions) : 0;
          const percentageA = a.totalQuestions > 0 ? (a.score / a.totalQuestions) : 0;
          return percentageB - percentageA;
        case "score_asc":
          const percentageAasc = a.totalQuestions > 0 ? (a.score / a.totalQuestions) : 0;
          const percentageBasc = b.totalQuestions > 0 ? (b.score / b.totalQuestions) : 0;
          return percentageAasc - percentageBasc;
        case "date_desc":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    setFilteredRecords(recordsToProcess);
  }, [allRecords, filterType, sortOrder]);

  const examTypeOptions = useMemo(() => {
    const types = new Set(allRecords.map(record => record.examType));
    const options = [{ value: "all", label: "جميع الأنواع" }];
    types.forEach(type => {
      options.push({ value: type, label: type });
    });
    return options;
  }, [allRecords]);


  return (
    <div className="container mx-auto py-10 px-4 min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <header className="mb-10 text-center">
        <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-slate-800 dark:text-slate-100">
          سجل إنجازاتك الاختبارية
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          تابع تقدمك، استعرض نتائج اختباراتك السابقة، وحافظ على حماسك للوصول إلى هدفك.
        </p>
      </header>

      <div className="mb-8 p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center sm:justify-start">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <label htmlFor="filterType" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              فلترة حسب نوع الاختبار:
            </label>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[280px] bg-white dark:bg-slate-800">
              <SelectValue placeholder="اختر نوعًا..." />
            </SelectTrigger>
            <SelectContent>
              {examTypeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <ArrowUpDown className="h-5 w-5 text-primary" />
            <label htmlFor="sortOrder" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              ترتيب حسب:
            </label>
          </div>
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
            <SelectTrigger className="w-full sm:w-[220px] bg-white dark:bg-slate-800">
              <SelectValue placeholder="اختر ترتيبًا..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">التاريخ (الأحدث أولاً)</SelectItem>
              <SelectItem value="date_asc">التاريخ (الأقدم أولاً)</SelectItem>
              <SelectItem value="score_desc">الدرجة (الأعلى أولاً)</SelectItem>
              <SelectItem value="score_asc">الدرجة (الأدنى أولاً)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className="h-28 w-28 text-slate-400 dark:text-slate-600 mx-auto mb-6 opacity-50" />
          <h2 className="text-2xl font-semibold mb-3 text-slate-700 dark:text-slate-300">
            {allRecords.length > 0 && filterType !== "all" ? "لا توجد سجلات تطابق الفلتر الحالي" : "لا توجد سجلات اختبارات حتى الآن"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            {allRecords.length === 0 ? "ابدأ اختبارك الأول لرؤية نتائجك هنا!" : "جرّب تغيير خيارات الفلترة أو الترتيب."}
          </p>
          {allRecords.length === 0 && (
            <Button onClick={() => setLocation('/')} size="lg" className="bg-primary hover:bg-primary/90 text-white">
              <TrendingUp className="h-5 w-5 ml-2" />
              ابدأ اختبارًا جديدًا
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {filteredRecords.map((record, index) => {
            const examDisplay = getInferredExamTypeDisplay(record.examType);
            const percentage = record.totalQuestions > 0 ? (record.score / record.totalQuestions) * 100 : 0;
            const scoreColor = getScoreColor(record.score, record.totalQuestions);

            return (
              <Card
                key={`${record.date}-${record.examType}-${index}`}
                className={`group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl dark:shadow-slate-900/50 dark:hover:shadow-slate-800/60 transition-all duration-300 ease-in-out border-l-4 border-${examDisplay.color}-500 bg-white dark:bg-slate-800/70 backdrop-blur-sm hover:-translate-y-1`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-${examDisplay.color}-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity duration-500`}
                />
                <CardHeader className="relative z-10 pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    {examDisplay.icon}
                    <span className={`text-${examDisplay.color}-600 dark:text-${examDisplay.color}-400 line-clamp-2 leading-tight`} title={examDisplay.name}>
                      {examDisplay.name}
                    </span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">{formatDate(record.date)}</p>
                </CardHeader>
                <CardContent className="relative z-10 pt-2">
                  <div className="mb-5 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-600 dark:text-slate-300">النتيجة:</p>
                      <p className={`text-md font-bold ${scoreColor}`}>
                        {getScoreIcon(record.score, record.totalQuestions)}
                        {record.score} من {record.totalQuestions}
                      </p>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 relative overflow-hidden">
                      <div
                        className={`bg-${examDisplay.color}-500 h-2.5 rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className={`text-right text-sm font-semibold ${scoreColor}`}>{percentage.toFixed(1)}%</p>
                  </div>

                  <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                    <Clock className="h-4 w-4 ml-2 text-sky-500" />
                    <span>الوقت المستغرق: </span>
                    <span className="font-medium mr-1">{formatTimeTakenDisplay(record.timeTaken)}</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="default"
                      size="sm"
                      className={`bg-${examDisplay.color}-600 hover:bg-${examDisplay.color}-700 dark:bg-${examDisplay.color}-500 dark:hover:bg-${examDisplay.color}-600 text-white flex-grow sm:flex-grow-0`}
                      onClick={() => {
                        localStorage.setItem('currentTestResult', JSON.stringify(record));
                        setLocation('/test-results'); // تأكد أن هذا المسار مُعد لعرض النتيجة
                        toast({
                          title: "جاري عرض النتيجة...",
                          description: `سيتم عرض تفاصيل اختبار: ${record.examType}`,
                        });
                      }}
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      شاهد النتيجة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
       <footer className="text-center mt-12 py-6 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} منصة قدراتك - كل الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
}