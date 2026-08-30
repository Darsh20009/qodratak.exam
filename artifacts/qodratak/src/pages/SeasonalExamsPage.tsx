import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Trophy, BookOpen, CheckCircle, Star, Lock, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}

function examStatusBadge(exam: any) {
  if (!exam.isActive) return <Badge className="bg-gray-500/10 text-gray-500 border-gray-200 dark:border-gray-700 text-xs">موقوف</Badge>;
  if (exam.hasEnded)  return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 text-xs">انتهى</Badge>;
  if (exam.hasStarted) return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 text-xs animate-pulse">جارٍ الآن</Badge>;
  return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 text-xs">قادم</Badge>;
}

function examTypeLabel(type: string) {
  switch (type) {
    case "verbal":       return { label: "لفظي",    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
    case "quantitative": return { label: "كمي",     color: "bg-green-100/10 text-green-700 dark:text-green-700" };
    default:             return { label: "مختلط",   color: "bg-teal-100/10 text-teal-700 dark:text-teal-700" };
  }
}

export default function SeasonalExamsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exams = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/seasonal-exams"],
  });

  const { data: myBookings = [] } = useQuery<any[]>({
    queryKey: ["/api/seasonal-exams/my-bookings"],
  });

  const bookMutation = useMutation({
    mutationFn: (examId: string) => apiRequest("POST", `/api/seasonal-exams/${examId}/book`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-exams/my-bookings"] });
      toast({ title: "✅ تم الحجز بنجاح", description: "تم تسجيلك في الاختبار الموسمي" });
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message || "فشل الحجز", variant: "destructive" });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (examId: string) => apiRequest("DELETE", `/api/seasonal-exams/${examId}/book`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-exams/my-bookings"] });
      toast({ title: "تم إلغاء الحجز" });
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message || "فشل الإلغاء", variant: "destructive" });
    }
  });

  const bookedExamIds = new Set((myBookings as any[]).map((b: any) => b.examId?.toString()));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          <p>جاري تحميل الاختبارات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-5" dir="rtl">

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
          <Star className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground leading-tight">الاختبارات الموسمية</h1>
          <p className="text-muted-foreground text-sm">اختبارات خاصة بالمناسبات والمواسم</p>
        </div>
      </div>

      {/* Active Bookings Banner */}
      {myBookings.length > 0 && (
        <Card className="rounded-2xl border-blue-200 dark:border-blue-900 bg-blue-500/5 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm">لديك {myBookings.length} حجز نشط</p>
              <p className="text-xs text-muted-foreground">ستتلقى إشعاراً عند انطلاق الاختبار</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {exams.length === 0 ? (
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Star className="w-12 h-12 opacity-20" />
            <p className="font-medium">لا توجد اختبارات موسمية حالياً</p>
            <p className="text-sm opacity-70">تابعنا للاطلاع على الاختبارات القادمة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {exams.map((exam: any) => {
            const isBooked = bookedExamIds.has(exam._id?.toString());
            const typeInfo = examTypeLabel(exam.examType);

            return (
              <Card
                key={exam._id}
                className={cn(
                  "rounded-2xl border shadow-sm overflow-hidden transition-all",
                  isBooked && "ring-2 ring-blue-400/30"
                )}
              >
                {/* Card Top Accent */}
                <div className={cn(
                  "h-1 w-full",
                  exam.hasStarted ? "bg-gradient-to-l from-emerald-400 to-teal-500" :
                  exam.hasEnded   ? "bg-gradient-to-l from-gray-400 to-gray-500" :
                  "bg-gradient-to-l from-amber-400 to-orange-500"
                )} />

                <CardContent className="p-4 md:p-5">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {examStatusBadge(exam)}
                        <Badge variant="outline" className={cn("text-xs border-0", typeInfo.color)}>
                          {typeInfo.label}
                        </Badge>
                        {isBooked && (
                          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-xs gap-1">
                            <CheckCircle className="w-3 h-3" />
                            محجوز
                          </Badge>
                        )}
                      </div>
                      <h2 className="font-bold text-foreground text-base leading-tight">{exam.title}</h2>
                      {exam.occasion && (
                        <p className="text-xs text-muted-foreground mt-0.5">{exam.occasion}</p>
                      )}
                    </div>
                    {exam.prizeAmount > 0 && (
                      <div className="flex-shrink-0 flex flex-col items-center bg-amber-500/10 rounded-xl px-3 py-2 text-center">
                        <Trophy className="w-4 h-4 text-amber-500 mb-0.5" />
                        <span className="text-amber-600 dark:text-amber-400 font-black text-sm leading-tight">{exam.prizeAmount}</span>
                        <span className="text-amber-500/70 text-[10px]">ر.س</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{exam.questions?.length || 0} سؤال</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{exam.timeLimit} دقيقة</span>
                    </div>
                    {exam.maxParticipants > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>الحد: {exam.maxParticipants} مشارك</span>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-muted/50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-muted-foreground mb-0.5">يبدأ</p>
                      <p className="text-xs font-semibold text-foreground">{formatDate(exam.startDate)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-muted-foreground mb-0.5">ينتهي</p>
                      <p className="text-xs font-semibold text-foreground">{formatDate(exam.endDate)}</p>
                    </div>
                  </div>

                  {/* Booking Deadline */}
                  {exam.bookingDeadline && !exam.hasStarted && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-500/10 rounded-xl px-3 py-2 mb-4">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>آخر موعد للحجز: {formatDate(exam.bookingDeadline)}</span>
                    </div>
                  )}

                  {/* Action Button */}
                  {exam.hasEnded ? (
                    <Button disabled className="w-full rounded-xl opacity-50" variant="outline" size="sm">
                      انتهى الاختبار
                    </Button>
                  ) : exam.hasStarted && !isBooked ? (
                    <Button disabled className="w-full rounded-xl opacity-50 gap-2" variant="outline" size="sm">
                      <Lock className="w-4 h-4" />
                      يجب الحجز المسبق للدخول
                    </Button>
                  ) : isBooked ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        disabled
                        className="flex-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-2 cursor-default border border-emerald-200 dark:border-emerald-900"
                        variant="ghost"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {exam.hasStarted ? "جارٍ الآن — لديك حجز" : "مسجل في الاختبار"}
                      </Button>
                      {!exam.hasStarted && (
                        <Button
                          data-testid={`button-cancel-booking-${exam._id}`}
                          variant="outline"
                          onClick={() => cancelMutation.mutate(exam._id)}
                          disabled={cancelMutation.isPending}
                          className="border-red-200 dark:border-red-900 text-red-500 hover:bg-red-500/10 rounded-xl text-sm gap-1.5 flex-shrink-0"
                          size="sm"
                        >
                          <X className="w-3.5 h-3.5" />
                          إلغاء الحجز
                        </Button>
                      )}
                    </div>
                  ) : exam.canBook ? (
                    <Button
                      data-testid={`button-book-exam-${exam._id}`}
                      onClick={() => bookMutation.mutate(exam._id)}
                      disabled={bookMutation.isPending}
                      className="w-full rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold gap-2 shadow-sm"
                      size="sm"
                    >
                      <Calendar className="w-4 h-4" />
                      {bookMutation.isPending ? "جاري الحجز..." : "احجز مقعدك الآن"}
                    </Button>
                  ) : (
                    <Button disabled className="w-full rounded-xl opacity-50" variant="outline" size="sm">
                      الحجز مغلق
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
