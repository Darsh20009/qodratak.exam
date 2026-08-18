import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Flame, Target, CheckCircle2, ChevronDown, Zap, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const GOAL_OPTIONS = [5, 10, 20, 30, 50];
const WEEKDAY_AR = ["أحد", "اثن", "ثلا", "أرب", "خمس", "جمع", "سبت"];

function CircularProgress({ value, max, size = 96, stroke = 8 }: { value: number; max: number; size?: number; stroke?: number }) {
  const radius = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);
  const done = value >= max;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke}
        className="fill-none stroke-gray-100 dark:stroke-gray-800" />
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn("fill-none transition-all duration-700 ease-out",
          done ? "stroke-emerald-500" : "stroke-[#2d8c4e]")}
        style={{ filter: done ? "drop-shadow(0 0 6px #10b981)" : undefined }} />
    </svg>
  );
}

function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const pieces = Array.from({ length: 16 }, (_, i) => ({
    color: ["#2d8c4e", "#10b981", "#fbbf24", "#3b82f6", "#ec4899"][i % 5],
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 0.8 + Math.random() * 0.6,
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl z-10">
      {pieces.map((p, i) => (
        <div key={i} className="absolute w-2 h-2 rounded-full animate-bounce"
          style={{ left: `${p.x}%`, top: "30%", background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />
      ))}
    </div>
  );
}

export function DailyGoalWidget({ userId }: { userId?: number | string }) {
  const qc = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [prevAnswered, setPrevAnswered] = useState(0);

  const { data, isLoading } = useQuery<{
    target: number;
    answered: number;
    date: string;
    streak: { current: number; longest: number; weekDays: boolean[] };
  }>({
    queryKey: ["/api/daily-goal"],
    refetchInterval: 30000,
    enabled: !!userId,
  });

  const setGoal = useMutation({
    mutationFn: (target: number) => apiRequest("POST", "/api/daily-goal/set", { target }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/daily-goal"] }); setShowPicker(false); },
  });

  const answered = data?.answered ?? 0;
  const target = data?.target ?? 20;
  const streak = data?.streak ?? { current: 0, longest: 0, weekDays: [] };
  const done = answered >= target;
  const pct = Math.min(Math.round((answered / target) * 100), 100);

  useEffect(() => {
    if (answered > prevAnswered && answered >= target && prevAnswered < target) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 3000);
    }
    setPrevAnswered(answered);
  }, [answered, target]);

  const todayDay = new Date().getDay();
  const weekLabels = Array.from({ length: 7 }, (_, i) => {
    const dayIdx = (todayDay - 6 + i + 7) % 7;
    return WEEKDAY_AR[dayIdx];
  });

  if (!userId) return null;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm animate-pulse">
        <div className="h-6 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3" />
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <Confetti show={justCompleted} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">هدفك اليومي</p>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>
        {/* Streak badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all",
          streak.current > 0
            ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-400"
        )}>
          <Flame className={cn("w-4 h-4", streak.current > 0 ? "text-orange-500" : "text-gray-300")} />
          <span>{streak.current}</span>
          <span className="text-xs font-normal">يوم</span>
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Main progress area */}
        <div className="flex items-center gap-5">
          {/* Circular Progress */}
          <div className="relative flex-shrink-0">
            <CircularProgress value={answered} max={target} size={88} stroke={7} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {done ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              ) : (
                <>
                  <span className="text-xl font-black text-gray-900 dark:text-white leading-none">{answered}</span>
                  <span className="text-xs text-gray-400">/ {target}</span>
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {done ? (
              <div className="space-y-1">
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-current" />
                  أتممت هدفك اليوم!
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  أجبت على {answered} سؤالاً من أصل {target}
                </p>
                {streak.current > 1 && (
                  <div className="flex items-center gap-1 text-xs text-orange-500 font-medium mt-1">
                    <Flame className="w-3.5 h-3.5" />
                    سلسلة {streak.current} أيام متواصلة! 🎉
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{pct}%</span>
                  <span className="text-xs text-gray-400">من هدفك اليومي</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {target - answered} سؤال متبقٍ لتحقيق الهدف
                </p>
                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Goal selector button */}
            <button
              onClick={() => setShowPicker(p => !p)}
              data-testid="btn-change-goal"
              className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors"
            >
              <Zap className="w-3 h-3" />
              هدف: {target} سؤال/يوم
              <ChevronDown className={cn("w-3 h-3 transition-transform", showPicker && "rotate-180")} />
            </button>
          </div>
        </div>

        {/* Goal picker */}
        {showPicker && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">اختر هدفك اليومي:</p>
            <div className="flex gap-2 flex-wrap">
              {GOAL_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setGoal.mutate(opt)}
                  data-testid={`btn-goal-${opt}`}
                  disabled={setGoal.isPending}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-sm font-bold transition-all",
                    target === opt
                      ? "bg-green-600 text-white shadow-sm shadow-green-200 dark:shadow-green-900"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Week view */}
        <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
          <div className="flex gap-1 justify-between">
            {streak.weekDays.map((completed, i) => {
              const isToday = i === 6;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                    completed
                      ? "bg-green-500 shadow-sm shadow-green-200 dark:shadow-green-900"
                      : isToday && !completed && answered > 0
                      ? "bg-green-100 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700"
                      : isToday
                      ? "border-2 border-gray-300 dark:border-gray-600 bg-transparent"
                      : "bg-gray-100 dark:bg-gray-800"
                  )}>
                    {completed ? (
                      <Flame className="w-4 h-4 text-white" />
                    ) : isToday && answered > 0 ? (
                      <span className="text-xs font-bold text-green-600">{answered}</span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    isToday ? "text-green-600 dark:text-green-400" : "text-gray-400"
                  )}>
                    {weekLabels[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Longest streak */}
        {streak.longest > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>أطول سلسلة: <span className="font-bold text-amber-500">{streak.longest} يوم</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
