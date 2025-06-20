import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface TimeBlockCalendarProps {
  userId: number;
  tasks: any[];
}

export const TimeBlockCalendar = ({ userId, tasks }: TimeBlockCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ar-SA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const getHoursArray = () => {
    const hours = [];
    for (let i = 6; i <= 23; i++) {
      hours.push(i);
    }
    return hours;
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "م" : "ص";
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">تقويم الوقت</h2>
          <p className="text-gray-600 dark:text-gray-400">
            خطط يومك بتخصيص فترات زمنية للمهام
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode("day")} 
                  className={viewMode === "day" ? "bg-blue-100" : ""}>
            يوم
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode("week")}
                  className={viewMode === "week" ? "bg-blue-100" : ""}>
            أسبوع
          </Button>
        </div>
      </div>

      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <div className="text-center">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {formatDate(currentDate)}
              </CardTitle>
            </div>
            
            <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[100px_1fr] divide-y divide-gray-200 dark:divide-gray-700">
            {/* Header */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium">الوقت</span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-medium">المهام والأنشطة</span>
            </div>

            {/* Time Slots */}
            {getHoursArray().map((hour) => (
              <div key={hour} className="contents">
                <div className="p-4 border-r border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                  {formatHour(hour)}
                </div>
                <div className="p-4 min-h-[60px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative group">
                  {/* Sample time blocks - في التطبيق الحقيقي، ستأتي هذه من قاعدة البيانات */}
                  {hour === 9 && (
                    <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded p-2 mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">مراجعة الإيميلات</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">9:00 - 9:30 ص</div>
                        </div>
                        <Badge variant="outline" className="text-xs">عمل</Badge>
                      </div>
                    </div>
                  )}
                  
                  {hour === 10 && (
                    <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded p-2 mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">العمل على المشروع الجديد</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">10:00 - 12:00 ص</div>
                        </div>
                        <Badge variant="outline" className="text-xs">مشروع</Badge>
                      </div>
                    </div>
                  )}
                  
                  {hour === 14 && (
                    <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded p-2 mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">جلسة بومودورو - دراسة</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">2:00 - 3:00 م</div>
                        </div>
                        <Badge variant="outline" className="text-xs">دراسة</Badge>
                      </div>
                    </div>
                  )}
                  
                  {hour === 18 && (
                    <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded p-2 mb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">تمارين رياضية</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">6:00 - 7:00 م</div>
                        </div>
                        <Badge variant="outline" className="text-xs">لياقة</Badge>
                      </div>
                    </div>
                  )}

                  {/* Add Time Block Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    إضافة نشاط
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">الوقت المجدول</p>
                <p className="text-2xl font-bold">6 ساعات</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">الأنشطة المجدولة</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">الوقت المتاح</p>
                <p className="text-2xl font-bold">12 ساعة</p>
              </div>
              <Plus className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>نصائح لتخطيط الوقت</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• خطط لأصعب المهام في أوقات ذروة طاقتك</li>
            <li>• اترك فترات راحة بين المهام المهمة</li>
            <li>• جدول وقتاً للمهام الطارئة والمقاطعات</li>
            <li>• راجع وعدل جدولك بناءً على ما تعلمته</li>
            <li>• استخدم ألوان مختلفة لفئات المهام المختلفة</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};