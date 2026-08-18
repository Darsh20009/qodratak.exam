import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Flame, Calendar, TrendingUp, BookOpen } from "lucide-react";

interface DayProgress {
  date: string;
  questionsAnswered: number;
  completedGoal: boolean;
}

interface HistoryResponse {
  history: DayProgress[];
}

function getIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 4) return 1;
  if (count <= 9) return 2;
  if (count <= 19) return 3;
  return 4;
}

const COLORS = [
  "bg-gray-100 dark:bg-gray-800",
  "bg-green-100 dark:bg-green-900/50",
  "bg-green-300 dark:bg-green-700",
  "bg-green-500 dark:bg-green-500",
  "bg-green-700 dark:bg-green-400",
];

const COLORS_HEX = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const COLORS_HEX_DARK = ["#2d333b", "#0e4429", "#006d32", "#26a641", "#39d353"];

const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const DAY_NAMES_AR = ["أح", "اث", "ث", "أر", "خ", "ج", "س"];

function getKsaToday() {
  const now = new Date();
  const ksa = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
  return `${ksa.getFullYear()}-${String(ksa.getMonth() + 1).padStart(2, "0")}-${String(ksa.getDate()).padStart(2, "0")}`;
}

function buildGrid(history: DayProgress[], weeks: number) {
  const dataMap: Record<string, number> = {};
  for (const d of history) {
    dataMap[d.date] = d.questionsAnswered;
  }

  const today = getKsaToday();
  const todayDate = new Date(today);
  const dayOfWeek = todayDate.getDay();

  // Build grid: weeks columns × 7 rows, ending at today
  const totalDays = weeks * 7;
  const grid: { date: string; count: number; intensity: 0 | 1 | 2 | 3 | 4 }[][] = [];

  for (let w = 0; w < weeks; w++) {
    const col: { date: string; count: number; intensity: 0 | 1 | 2 | 3 | 4 }[] = [];
    for (let d = 0; d < 7; d++) {
      const daysAgo = (weeks - 1 - w) * 7 + (6 - d) - dayOfWeek + (dayOfWeek === 6 ? 0 : 0);
      const daysFromEnd = (weeks - 1 - w) * 7 + (6 - d);
      const dt = new Date(todayDate);
      dt.setDate(dt.getDate() - daysFromEnd);
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      const isFuture = dateStr > today;
      const count = dataMap[dateStr] || 0;
      col.push({ date: dateStr, count, intensity: isFuture ? 0 : getIntensity(count) });
    }
    grid.push(col);
  }

  return grid;
}

function getMonthLabels(grid: { date: string }[][], weeks: number) {
  const labels: { col: number; month: string }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < grid.length; w++) {
    const firstDay = grid[w][0];
    if (!firstDay) continue;
    const month = parseInt(firstDay.date.split("-")[1]) - 1;
    if (month !== lastMonth) {
      labels.push({ col: w, month: MONTH_NAMES_AR[month] });
      lastMonth = month;
    }
  }
  return labels;
}

interface TooltipState {
  date: string;
  count: number;
  x: number;
  y: number;
}

export function ActivityHeatmap({ userId }: { userId?: number | string }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [weeks, setWeeks] = useState(17);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = document.documentElement.classList.contains("dark");

  const { data, isLoading } = useQuery<HistoryResponse>({
    queryKey: ["/api/daily-goal/history", 365],
    queryFn: () => fetch("/api/daily-goal/history?days=365").then(r => r.json()),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const history = data?.history || [];
  const totalQuestions = history.reduce((s, d) => s + d.questionsAnswered, 0);
  const activeDays = history.filter(d => d.questionsAnswered > 0).length;
  const maxDay = history.reduce((m, d) => Math.max(m, d.questionsAnswered), 0);

  const grid = buildGrid(history, weeks);
  const monthLabels = getMonthLabels(grid, weeks);

  const CELL = 13;
  const GAP = 2;

  const handleCellClick = (e: React.MouseEvent, cell: { date: string; count: number }) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip({
      date: cell.date,
      count: cell.count,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setTimeout(() => setTooltip(null), 2000);
  };

  if (!userId) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">خريطة النشاط</h3>
            <p className="text-xs text-gray-400">سجل دراستك اليومي</p>
          </div>
        </div>
        <div className="flex gap-1">
          {[17, 26, 52].map(w => (
            <button
              key={w}
              onClick={() => setWeeks(w)}
              className={cn(
                "text-xs px-2 py-0.5 rounded-lg font-medium transition-colors",
                weeks === w ? "bg-green-600 text-white" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              {w === 17 ? "4ش" : w === 26 ? "6ش" : "سنة"}
            </button>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-4 pb-3 flex gap-3">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-green-500" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{totalQuestions.toLocaleString()}</span>
          <span className="text-xs text-gray-400">سؤال</span>
        </div>
        <div className="w-px h-4 bg-gray-100 dark:bg-gray-800 self-center" />
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{activeDays}</span>
          <span className="text-xs text-gray-400">يوم نشط</span>
        </div>
        <div className="w-px h-4 bg-gray-100 dark:bg-gray-800 self-center" />
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{maxDay}</span>
          <span className="text-xs text-gray-400">أعلى يوم</span>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-28 gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
            <span className="text-xs text-gray-400">جاري التحميل...</span>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar" ref={scrollRef}>
            <div style={{ minWidth: `${weeks * (CELL + GAP)}px` }}>
              {/* Month labels */}
              <div className="relative mb-1" style={{ height: "14px" }}>
                {monthLabels.map((lbl, i) => (
                  <span
                    key={i}
                    className="absolute text-[9px] text-gray-400 dark:text-gray-500 font-medium"
                    style={{ right: `${(grid.length - 1 - lbl.col) * (CELL + GAP)}px` }}
                    dir="rtl"
                  >
                    {lbl.month}
                  </span>
                ))}
              </div>

              {/* Day labels + grid */}
              <div className="flex gap-0.5 flex-row-reverse">
                {/* Day labels on the left (right in RTL) */}
                <div className="flex flex-col gap-0.5 ml-1" style={{ width: "14px" }}>
                  {DAY_NAMES_AR.map((d, i) => (
                    <div key={i} style={{ height: `${CELL}px` }} className="flex items-center justify-end">
                      {i % 2 === 0 && (
                        <span className="text-[8px] text-gray-300 dark:text-gray-600">{d}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Cells */}
                <div className="flex gap-0.5 flex-row-reverse flex-1">
                  {grid.map((col, wi) => (
                    <div key={wi} className="flex flex-col gap-0.5">
                      {col.map((cell, di) => {
                        const today = getKsaToday();
                        const isToday = cell.date === today;
                        const colors = isDark ? COLORS_HEX_DARK : COLORS_HEX;
                        return (
                          <button
                            key={di}
                            onClick={(e) => handleCellClick(e, cell)}
                            title={`${cell.date}: ${cell.count} سؤال`}
                            style={{
                              width: `${CELL}px`,
                              height: `${CELL}px`,
                              backgroundColor: colors[cell.intensity],
                              borderRadius: "3px",
                              border: isToday ? "2px solid #16a34a" : "none",
                              cursor: "pointer",
                              flexShrink: 0,
                              transition: "transform 0.1s",
                            }}
                            className="hover:scale-110 active:scale-90"
                            data-testid={`heatmap-cell-${cell.date}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-3">
          <span className="text-[10px] text-gray-400">أقل</span>
          {[0, 1, 2, 3, 4].map(lvl => {
            const colors = isDark ? COLORS_HEX_DARK : COLORS_HEX;
            return (
              <div
                key={lvl}
                style={{ width: "11px", height: "11px", borderRadius: "2px", backgroundColor: colors[lvl as 0 | 1 | 2 | 3 | 4] }}
              />
            );
          })}
          <span className="text-[10px] text-gray-400">أكثر</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-xl px-3 py-2 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2"
          style={{ left: tooltip.x, top: tooltip.y }}
          dir="rtl"
        >
          <p className="font-bold">{tooltip.date}</p>
          <p className="text-gray-300">{tooltip.count} سؤال {tooltip.count === 0 ? "😴" : tooltip.count >= 20 ? "🔥" : tooltip.count >= 10 ? "⚡" : "✓"}</p>
        </div>
      )}
    </div>
  );
}
