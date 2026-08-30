import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  CalendarDays, ArrowLeft, CheckCircle2, Circle, Clock,
  Zap, Target, Brain, BookOpen, BarChart3, Sparkles, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlanTask {
  id: string;
  title: string;
  description: string;
  type: "test" | "review" | "study" | "challenge";
  durationMinutes: number;
  href: string;
  priority: "high" | "medium" | "low";
  completed?: boolean;
}

const typeConfig = {
  test: { icon: Target, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  review: { icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  study: { icon: Brain, color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" },
  challenge: { icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

const priorityLabel = { high: "مهم", medium: "متوسط", low: "اختياري" };
const priorityColor = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-muted-foreground bg-muted border-border",
};

function TaskRow({ task, onToggle }: { task: PlanTask; onToggle: (id: string) => void }) {
  const cfg = typeConfig[task.type];
  const Icon = cfg.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border bg-card transition-all duration-200 ${task.completed ? "opacity-50" : ""}`}
      style={{ borderColor: "rgba(255,255,255,0.07)" }}>
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 flex-shrink-0 transition-colors"
        data-testid={`button-toggle-task-${task.id}`}
      >
        {task.completed
          ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          : <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground" />
        }
      </button>

      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {task.title}
          </p>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${priorityColor[task.priority]}`}>
            {priorityLabel[task.priority]}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{task.description}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.durationMinutes} دقيقة
          </span>
          {!task.completed && (
            <Link href={task.href}>
              <span className={`text-xs font-semibold ${cfg.color} hover:underline cursor-pointer`}>ابدأ ←</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AiDailyPlan() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const userId = user?.id || user?._id;
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const { data: plan, isLoading, refetch, isFetching } = useQuery<{
    date: string;
    totalMinutes: number;
    tasks: PlanTask[];
    motivation: string;
    daysToExam?: number;
  }>({
    queryKey: ["/api/ai/daily-plan", userId],
    enabled: !!userId,
    staleTime: 60 * 60 * 1000,
  });

  const toggleTask = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedCount = plan?.tasks.filter(t => completedIds.has(t.id)).length ?? 0;
  const totalTasks = plan?.tasks.length ?? 0;
  const progressPct = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const today = new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <SEO title="خطة اليوم - منصة قدراتك" description="خطة مراجعتك اليومية الذكية" url="/ai-hub/daily-plan" />

      <div className="min-h-screen bg-background" dir="rtl">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          {/* Back */}
          <Link href="/ai-hub">
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
              <ArrowLeft className="w-4 h-4 rotate-180" />
              مركز الذكاء
            </button>
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-black text-foreground">خطة اليوم</h1>
                <p className="text-sm text-muted-foreground mt-1">{today}</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              data-testid="button-refresh-plan"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">جارٍ إعداد خطتك اليومية...</p>
            </div>
          ) : !plan ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-foreground font-semibold">لا يوجد بيانات كافية بعد</p>
              <p className="text-sm text-muted-foreground max-w-xs">أجرِ بعض الاختبارات لتفعيل الخطة اليومية الشخصية</p>
              <Link href="/qiyas">
                <button className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors" data-testid="button-start-exam-from-plan">
                  ابدأ اختبار الآن
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Motivation Banner */}
              {plan.motivation && (
                <div className="flex gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-300 font-medium">{plan.motivation}</p>
                </div>
              )}

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border bg-card p-3 text-center" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="text-xl font-black text-foreground">{completedCount}/{totalTasks}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">مهام</div>
                </div>
                <div className="rounded-xl border bg-card p-3 text-center" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="text-xl font-black text-foreground">{plan.totalMinutes}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">دقيقة</div>
                </div>
                {plan.daysToExam && (
                  <div className="rounded-xl border bg-card p-3 text-center" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                    <div className="text-xl font-black text-amber-400">{plan.daysToExam}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">يوم للاختبار</div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>التقدم اليومي</span>
                  <span className="text-emerald-400 font-semibold">{Math.round(progressPct)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-2">
                {(plan.tasks ?? []).map(task => (
                  <TaskRow
                    key={task.id}
                    task={{ ...task, completed: completedIds.has(task.id) }}
                    onToggle={toggleTask}
                  />
                ))}
              </div>

              {completedCount === totalTasks && totalTasks > 0 && (
                <div className="flex items-center justify-center gap-2 py-4 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-bold">أتممت خطة اليوم! 🎉</span>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
}
