
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatters';
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
  Trophy,
  Calendar,
  Download,
  Share2,
  Star,
  Zap,
  Brain,
  FileText,
  CloudSun,
  GraduationCap,
  Users,
  Flame,
  Medal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ExamRecord {
  date: string;
  examType: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  difficulty?: string;
  sectionsData?: any[];
  achievementLevel?: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

interface ExamStats {
  totalExams: number;
  averageScore: number;
  totalTimeSpent: number;
  bestPerformance: number;
  improvementTrend: number;
  examsByType: Record<string, number>;
}

// Enhanced color and icon system for different exam types
const getExamTypeInfo = (examName: string) => {
  const lowerExamName = examName.toLowerCase();
  
  if (lowerExamName.includes("قياس") || lowerExamName.includes("قدرات")) {
    return { 
      icon: <ListChecks className="h-6 w-6" />, 
      name: examName, 
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      textColor: "text-emerald-700 dark:text-emerald-400",
      category: "اختبار قدرات/قياس",
      badge: "رسمي"
    };
  }
  if (lowerExamName.includes("لفظي") || lowerExamName.includes("verbal")) {
    return { 
      icon: <BookText className="h-6 w-6" />, 
      name: examName, 
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-700 dark:text-blue-400",
      category: "اختبار لفظي",
      badge: "لفظي"
    };
  }
  if (lowerExamName.includes("كمي") || lowerExamName.includes("quantitative")) {
    return { 
      icon: <Calculator className="h-6 w-6" />, 
      name: examName, 
      color: "from-purple-500 to-violet-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-700 dark:text-purple-400",
      category: "اختبار كمي",
      badge: "كمي"
    };
  }
  if (lowerExamName.includes("تأهيلي") || lowerExamName.includes("qualification")) {
    return { 
      icon: <GraduationCap className="h-6 w-6" />, 
      name: examName, 
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      textColor: "text-amber-700 dark:text-amber-400",
      category: "اختبار تأهيلي",
      badge: "تأهيلي"
    };
  }
  if (lowerExamName.includes("تجريبي") || lowerExamName.includes("mock")) {
    return { 
      icon: <CloudSun className="h-6 w-6" />, 
      name: examName, 
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      textColor: "text-cyan-700 dark:text-cyan-400",
      category: "اختبار تجريبي",
      badge: "تجريبي"
    };
  }
  if (lowerExamName.includes("مخصص") || lowerExamName.includes("custom")) {
    return { 
      icon: <Target className="h-6 w-6" />, 
      name: examName, 
      color: "from-rose-500 to-pink-600",
      bgColor: "bg-rose-50 dark:bg-rose-900/20",
      textColor: "text-rose-700 dark:text-rose-400",
      category: "اختبار مخصص",
      badge: "مخصص"
    };
  }
  
  return { 
    icon: <FileText className="h-6 w-6" />, 
    name: examName, 
    color: "from-slate-500 to-gray-600",
    bgColor: "bg-slate-50 dark:bg-slate-900/20",
    textColor: "text-slate-700 dark:text-slate-400",
    category: "اختبار عام",
    badge: "عام"
  };
};

const getPerformanceInfo = (score: number, totalQuestions: number) => {
  if (totalQuestions === 0) return { 
    level: 'needs_improvement', 
    icon: <XCircle className="h-5 w-5" />, 
    color: 'text-slate-500',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    label: 'غير مكتمل'
  };
  
  const percentage = (score / totalQuestions) * 100;
  
  if (percentage >= 85) return { 
    level: 'excellent', 
    icon: <Trophy className="h-5 w-5" />, 
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'ممتاز'
  };
  if (percentage >= 75) return { 
    level: 'good', 
    icon: <Medal className="h-5 w-5" />, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'جيد جداً'
  };
  if (percentage >= 60) return { 
    level: 'average', 
    icon: <Star className="h-5 w-5" />, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'جيد'
  };
  
  return { 
    level: 'needs_improvement', 
    icon: <Flame className="h-5 w-5" />, 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'يحتاج تحسين'
  };
};

const formatTimeTaken = (minutes: number): string => {
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

export default function EnhancedExamRecordsPage() {
  const [allRecords, setAllRecords] = useState<ExamRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ExamRecord[]>([]);
  const [_location, setLocation] = useLocation();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"date_desc" | "date_asc" | "score_desc" | "score_asc">("date_desc");
  const [showStats, setShowStats] = useState(false);

  // Enhanced data loading with better error handling and data validation
  useEffect(() => {
    const loadExamRecords = () => {
      try {
        // Load from multiple possible sources
        const sources = [
          'examRecords',
          'qiyasExamRecords', 
          'mockExamRecords',
          'customExamRecords',
          'qualificationExamRecords'
        ];
        
        let allStoredRecords: ExamRecord[] = [];
        
        sources.forEach(source => {
          const storedData = localStorage.getItem(source);
          if (storedData) {
            try {
              const parsedData = JSON.parse(storedData);
              if (Array.isArray(parsedData)) {
                allStoredRecords = [...allStoredRecords, ...parsedData];
              } else if (parsedData && typeof parsedData === 'object') {
                allStoredRecords.push(parsedData);
              }
            } catch (parseError) {
              console.warn(`Failed to parse ${source}:`, parseError);
            }
          }
        });

        // Enhanced validation and cleanup
        const validRecords = allStoredRecords
          .filter(record => 
            record &&
            typeof record.date === 'string' &&
            typeof record.examType === 'string' &&
            typeof record.score === 'number' &&
            typeof record.totalQuestions === 'number' && record.totalQuestions >= 0 &&
            typeof record.timeTaken === 'number' && record.timeTaken >= 0
          )
          .map(record => ({
            ...record,
            achievementLevel: getPerformanceInfo(record.score, record.totalQuestions).level as any
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Remove duplicates based on date and exam type
        const uniqueRecords = validRecords.filter((record, index, self) => 
          index === self.findIndex(r => 
            r.date === record.date && 
            r.examType === record.examType &&
            r.score === record.score
          )
        );

        setAllRecords(uniqueRecords);
        
        if (uniqueRecords.length > 0) {
          toast({
            title: "تم تحميل السجلات بنجاح",
            description: `تم العثور على ${uniqueRecords.length} سجل اختبار`,
          });
        }
      } catch (error) {
        console.error("Failed to load exam records:", error);
        toast({
          title: "خطأ في تحميل السجلات",
          description: "حدث خطأ أثناء تحميل سجلات الاختبارات",
          variant: "destructive",
        });
        setAllRecords([]);
      }
    };

    loadExamRecords();
  }, [toast]);

  // Enhanced filtering and sorting
  useEffect(() => {
    let recordsToProcess = [...allRecords];

    if (filterType !== "all") {
      recordsToProcess = recordsToProcess.filter(record => {
        const examInfo = getExamTypeInfo(record.examType);
        return record.examType === filterType || examInfo.category.includes(filterType);
      });
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

  // Calculate comprehensive statistics
  const examStats = useMemo((): ExamStats => {
    if (allRecords.length === 0) return {
      totalExams: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      bestPerformance: 0,
      improvementTrend: 0,
      examsByType: {}
    };

    const totalScore = allRecords.reduce((sum, record) => 
      sum + (record.totalQuestions > 0 ? (record.score / record.totalQuestions) * 100 : 0), 0
    );
    const averageScore = totalScore / allRecords.length;
    const totalTimeSpent = allRecords.reduce((sum, record) => sum + record.timeTaken, 0);
    const bestPerformance = Math.max(...allRecords.map(record => 
      record.totalQuestions > 0 ? (record.score / record.totalQuestions) * 100 : 0
    ));

    const examsByType = allRecords.reduce((acc, record) => {
      const examInfo = getExamTypeInfo(record.examType);
      acc[examInfo.category] = (acc[examInfo.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate improvement trend (last 5 vs first 5 exams)
    const recentExams = allRecords.slice(0, 5);
    const olderExams = allRecords.slice(-5);
    const recentAvg = recentExams.reduce((sum, record) => 
      sum + (record.totalQuestions > 0 ? (record.score / record.totalQuestions) * 100 : 0), 0
    ) / recentExams.length;
    const olderAvg = olderExams.reduce((sum, record) => 
      sum + (record.totalQuestions > 0 ? (record.score / record.totalQuestions) * 100 : 0), 0
    ) / olderExams.length;
    const improvementTrend = recentAvg - olderAvg;

    return {
      totalExams: allRecords.length,
      averageScore,
      totalTimeSpent,
      bestPerformance,
      improvementTrend,
      examsByType
    };
  }, [allRecords]);

  const examTypeOptions = useMemo(() => {
    const types = new Set(allRecords.map(record => getExamTypeInfo(record.examType).category));
    const options = [{ value: "all", label: "جميع الأنواع" }];
    types.forEach(type => {
      options.push({ value: type, label: type });
    });
    return options;
  }, [allRecords]);

  const exportRecords = () => {
    const dataStr = JSON.stringify(allRecords, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam-records-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "تم تصدير السجلات",
      description: "تم تحميل ملف السجلات بنجاح",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto py-12 px-4 max-w-7xl">
        {/* Animated Header */}
        <header className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-blue-500 to-indigo-600 rounded-full mb-6 shadow-xl animate-pulse">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-800 dark:from-slate-100 dark:via-blue-400 dark:to-indigo-300 bg-clip-text text-transparent mb-4">
              مركز إنجازاتك الاختبارية
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              تابع تطورك الأكاديمي، حلل أداءك، واكتشف نقاط قوتك في رحلتك التعليمية
            </p>
            
            {/* Quick Stats Bar */}
            {allRecords.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto">
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{examStats.totalExams}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">اختبار مكتمل</div>
                </div>
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{examStats.averageScore.toFixed(1)}%</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">متوسط الدرجات</div>
                </div>
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{Math.round(examStats.totalTimeSpent / 60)}h</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">إجمالي الوقت</div>
                </div>
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{examStats.bestPerformance.toFixed(1)}%</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">أفضل أداء</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Enhanced Controls */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">فلترة:</label>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[280px] bg-white/90 dark:bg-slate-700/90">
                  <SelectValue placeholder="اختر نوعًا..." />
                </SelectTrigger>
                <SelectContent>
                  {examTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-primary" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">ترتيب:</label>
              </div>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                <SelectTrigger className="w-full sm:w-[220px] bg-white/90 dark:bg-slate-700/90">
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
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowStats(!showStats)}
                className="bg-white/90 dark:bg-slate-700/90"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showStats ? 'إخفاء الإحصائيات' : 'عرض الإحصائيات'}
              </Button>
              {allRecords.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={exportRecords}
                  className="bg-white/90 dark:bg-slate-700/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  تصدير
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && allRecords.length > 0 && (
          <Card className="mb-8 bg-gradient-to-br from-white/90 to-blue-50/50 dark:from-slate-800/90 dark:to-slate-700/50 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Brain className="h-6 w-6 text-primary" />
                تحليل شامل للأداء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">توزيع الاختبارات حسب النوع</h4>
                  {Object.entries(examStats.examsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">مؤشرات الأداء</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>متوسط الدرجات</span>
                        <span>{examStats.averageScore.toFixed(1)}%</span>
                      </div>
                      <Progress value={examStats.averageScore} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>أفضل أداء</span>
                        <span>{examStats.bestPerformance.toFixed(1)}%</span>
                      </div>
                      <Progress value={examStats.bestPerformance} className="h-2" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">اتجاه التحسن</h4>
                  <div className={`flex items-center gap-2 text-lg font-semibold ${
                    examStats.improvementTrend > 0 ? 'text-green-600 dark:text-green-400' : 
                    examStats.improvementTrend < 0 ? 'text-red-600 dark:text-red-400' : 
                    'text-slate-600 dark:text-slate-400'
                  }`}>
                    {examStats.improvementTrend > 0 ? <TrendingUp className="h-5 w-5" /> : 
                     examStats.improvementTrend < 0 ? <ArrowUpDown className="h-5 w-5 rotate-180" /> :
                     <ArrowUpDown className="h-5 w-5" />}
                    {examStats.improvementTrend > 0 ? '+' : ''}{examStats.improvementTrend.toFixed(1)}%
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    مقارنة بين أحدث 5 اختبارات والـ 5 الأقدم
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Records Display */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full blur-2xl"></div>
              <BarChart3 className="relative h-32 w-32 text-slate-400 dark:text-slate-600 mx-auto mb-8 opacity-60" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-slate-700 dark:text-slate-300">
              {allRecords.length > 0 && filterType !== "all" ? "لا توجد سجلات تطابق الفلتر الحالي" : "ابدأ رحلتك الاختبارية الآن!"}
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-md mx-auto">
              {allRecords.length === 0 ? "كل اختبار جديد هو خطوة نحو تحقيق أهدافك الأكاديمية" : "جرّب تغيير خيارات الفلترة أو الترتيب"}
            </p>
            {allRecords.length === 0 && (
              <Button 
                onClick={() => setLocation('/')} 
                size="lg" 
                className="bg-gradient-to-r from-primary via-blue-500 to-indigo-600 hover:from-primary/90 hover:via-blue-600 hover:to-indigo-700 text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Sparkles className="h-6 w-6 ml-2" />
                ابدأ اختبارك الأول
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredRecords.map((record, index) => {
              const examInfo = getExamTypeInfo(record.examType);
              const performance = getPerformanceInfo(record.score, record.totalQuestions);
              const percentage = record.totalQuestions > 0 ? (record.score / record.totalQuestions) * 100 : 0;

              return (
                <Card
                  key={`${record.date}-${record.examType}-${index}`}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl dark:shadow-slate-900/50 transition-all duration-500 ease-out border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:-translate-y-2 hover:scale-[1.02]"
                >
                  {/* Gradient Header */}
                  <div className={`h-2 bg-gradient-to-r ${examInfo.color}`}></div>
                  
                  {/* Floating Badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <Badge 
                      variant="secondary" 
                      className={`${examInfo.bgColor} ${examInfo.textColor} border-0 font-medium px-3 py-1`}
                    >
                      {examInfo.badge}
                    </Badge>
                  </div>

                  {/* Performance Badge */}
                  <div className="absolute top-4 right-4 z-20">
                    <div className={`flex items-center gap-1 ${performance.bgColor} ${performance.color} rounded-full px-3 py-1 text-xs font-medium`}>
                      {performance.icon}
                      {performance.label}
                    </div>
                  </div>

                  <CardHeader className="pt-16 pb-4">
                    <CardTitle className="flex items-start gap-3 text-lg leading-tight">
                      <div className={`p-2 rounded-xl ${examInfo.bgColor} ${examInfo.textColor} shadow-sm`}>
                        {examInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-1" title={examInfo.name}>
                          {examInfo.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <Calendar className="h-4 w-4" />
                          {formatDate(record.date)}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0 pb-6">
                    {/* Score Display */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">النتيجة</span>
                        <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                          {record.score} من {record.totalQuestions}
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={percentage} className="h-3 mb-2" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent h-3 rounded-full animate-pulse opacity-50"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-lg font-bold ${performance.color}`}>
                          {percentage.toFixed(1)}%
                        </span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(percentage / 20) 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-slate-300 dark:text-slate-600'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Time and Details */}
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>{formatTimeTaken(record.timeTaken)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        <span>{record.totalQuestions} سؤال</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      className={`w-full bg-gradient-to-r ${examInfo.color} hover:opacity-90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]`}
                      onClick={() => {
                        localStorage.setItem('currentTestResult', JSON.stringify(record));
                        setLocation('/test-results');
                        toast({
                          title: "جاري عرض التفاصيل...",
                          description: `سيتم عرض تفاصيل: ${record.examType}`,
                        });
                      }}
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      عرض التفاصيل الكاملة
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Enhanced Footer */}
        <footer className="text-center mt-16 py-8 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              منصة قدراتك
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} جميع الحقوق محفوظة - نحو مستقبل أكاديمي مشرق
          </p>
        </footer>
      </div>
    </div>
  );
}
