
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Brain, 
  Clock, 
  Target, 
  Calendar,
  Award,
  Activity,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface AnalyticsData {
  weeklyProgress: Array<{ day: string; tests: number; score: number }>;
  subjectPerformance: Array<{ subject: string; score: number; improvement: number }>;
  timeDistribution: Array<{ period: string; minutes: number }>;
  difficultyBreakdown: Array<{ level: string; attempted: number; passed: number }>;
  monthlyTrend: Array<{ month: string; tests: number; avgScore: number }>;
}

export function InteractiveAnalytics({ userId }: { userId?: number }) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    weeklyProgress: [
      { day: 'السبت', tests: 3, score: 85 },
      { day: 'الأحد', tests: 2, score: 92 },
      { day: 'الاثنين', tests: 4, score: 78 },
      { day: 'الثلاثاء', tests: 1, score: 95 },
      { day: 'الأربعاء', tests: 3, score: 88 },
      { day: 'الخميس', tests: 2, score: 91 },
      { day: 'الجمعة', tests: 5, score: 87 }
    ],
    subjectPerformance: [
      { subject: 'اللفظي', score: 88, improvement: 12 },
      { subject: 'الكمي', score: 82, improvement: 8 },
      { subject: 'المنطق', score: 90, improvement: 15 },
      { subject: 'الاستنتاج', score: 85, improvement: -3 }
    ],
    timeDistribution: [
      { period: 'الصباح', minutes: 120 },
      { period: 'الظهر', minutes: 80 },
      { period: 'المساء', minutes: 200 },
      { period: 'الليل', minutes: 45 }
    ],
    difficultyBreakdown: [
      { level: 'سهل', attempted: 45, passed: 42 },
      { level: 'متوسط', attempted: 38, passed: 31 },
      { level: 'صعب', attempted: 22, passed: 15 },
      { level: 'خبير', attempted: 8, passed: 4 }
    ],
    monthlyTrend: [
      { month: 'يناير', tests: 25, avgScore: 78 },
      { month: 'فبراير', tests: 32, avgScore: 82 },
      { month: 'مارس', tests: 28, avgScore: 85 },
      { month: 'أبريل', tests: 35, avgScore: 88 },
      { month: 'مايو', tests: 42, avgScore: 86 },
      { month: 'يونيو', tests: 38, avgScore: 90 }
    ]
  });

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88', '#ff0084'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const insights = [
    {
      title: 'أفضل وقت للدراسة',
      value: 'المساء (7-9 م)',
      change: '+15%',
      positive: true,
      icon: <Clock className="h-5 w-5" />
    },
    {
      title: 'المادة الأقوى',
      value: 'المنطق',
      change: '90%',
      positive: true,
      icon: <Brain className="h-5 w-5" />
    },
    {
      title: 'معدل التحسن',
      value: '+12 نقطة',
      change: 'شهرياً',
      positive: true,
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      title: 'الهدف القادم',
      value: 'مستوى خبير',
      change: '75% مكتمل',
      positive: true,
      icon: <Target className="h-5 w-5" />
    }
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* نظرة عامة سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {insights.map((insight, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  {insight.icon}
                </div>
                <Badge variant={insight.positive ? 'default' : 'destructive'}>
                  {insight.change}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm text-muted-foreground">{insight.title}</h3>
              <p className="text-xl font-bold">{insight.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* الرسوم البيانية التفاعلية */}
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weekly">أسبوعي</TabsTrigger>
          <TabsTrigger value="subjects">المواد</TabsTrigger>
          <TabsTrigger value="time">الوقت</TabsTrigger>
          <TabsTrigger value="difficulty">الصعوبة</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                التقدم الأسبوعي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="tests" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                    name="عدد الاختبارات"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stackId="2"
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    fillOpacity={0.6}
                    name="النتيجة"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                أداء المواد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#8884d8" name="النتيجة" />
                  <Bar dataKey="improvement" fill="#82ca9d" name="التحسن" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                توزيع أوقات الدراسة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.timeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ period, percent }) => `${period} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="minutes"
                  >
                    {analyticsData.timeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="difficulty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                تحليل مستويات الصعوبة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.difficultyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="attempted" fill="#8884d8" name="المحاولة" />
                  <Bar dataKey="passed" fill="#82ca9d" name="النجاح" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* الاتجاه الشهري */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            الاتجاه الشهري للأداء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analyticsData.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="tests" 
                stroke="#8884d8" 
                strokeWidth={3}
                name="عدد الاختبارات"
              />
              <Line 
                type="monotone" 
                dataKey="avgScore" 
                stroke="#82ca9d" 
                strokeWidth={3}
                name="متوسط النتيجة"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
