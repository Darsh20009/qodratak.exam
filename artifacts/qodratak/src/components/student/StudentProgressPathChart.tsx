import { useMemo } from "react";
import { AlertTriangle, BarChart3, CalendarDays, LoaderCircle } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  StudentDashboardProgram,
  StudentDashboardProgressOverviewProps,
  StudentDashboardTrendPoint,
} from "@/lib/studentDashboardProgress";

type Props = Pick<
  StudentDashboardProgressOverviewProps,
  "program" | "onProgramChange" | "trendState" | "trendPoints"
>;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "تاريخ غير متاح";
  return date.toLocaleDateString("ar-SA", { day: "numeric", month: "short", year: "numeric" });
}

function chartTickLabel(value: string, points: StudentDashboardTrendPoint[]) {
  const point = points.find((item) => item.id === value);
  if (!point) return "";
  const date = new Date(point.date);
  return Number.isNaN(date.getTime())
    ? point.title.slice(0, 12)
    : date.toLocaleDateString("ar-SA", { day: "numeric", month: "short" });
}

function ScoreTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: StudentDashboardTrendPoint }> }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="max-w-56 rounded-xl border border-border bg-popover px-3 py-2 text-right shadow-sm" dir="rtl">
      <p className="text-xs font-black text-foreground">{point.title}</p>
      <p className="mt-1 text-sm font-black text-primary">{point.percentage.toLocaleString("ar-SA")}%</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(point.date)}</p>
      {typeof point.totalQuestions === "number" && (
        <p className="mt-1 text-[11px] text-muted-foreground">{point.totalQuestions.toLocaleString("ar-SA")} سؤالًا</p>
      )}
    </div>
  );
}

function StateMessage({ icon: Icon, title, body, loading = false }: {
  icon: typeof BarChart3;
  title: string;
  body: string;
  loading?: boolean;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center" role={loading ? "status" : undefined}>
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
      </span>
      <p className="mt-3 font-black text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

export default function StudentProgressPathChart({ program, onProgramChange, trendState, trendPoints }: Props) {
  const orderedPoints = useMemo(
    () => [...trendPoints].sort((left, right) => Date.parse(left.date) - Date.parse(right.date)),
    [trendPoints],
  );
  const programName = program === "qudrat" ? "القدرات" : "التحصيلي";
  const canPlotLine = trendState === "ready" && orderedPoints.length >= 2;
  const oneResult = orderedPoints.length === 1 && (trendState === "insufficient" || trendState === "ready");
  const chartColor = "hsl(var(--primary))";
  const gridColor = "hsl(var(--border))";
  const tickColor = "hsl(var(--muted-foreground))";

  const selectProgram = (value: StudentDashboardProgram) => onProgramChange(value);

  return (
    <section
      data-testid="student-progress-path"
      aria-labelledby="student-progress-path-title"
      className="rounded-3xl border border-border bg-card p-5 sm:p-6"
      dir="rtl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black text-primary">نتائجك المحفوظة</p>
          <h3 id="student-progress-path-title" className="mt-1 text-xl font-black text-foreground">دقّة الإجابة عبر الاختبارات</h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
            النسب تمثل دقّة الأسئلة في النتائج المحفوظة لهذا المسار؛ وليست درجة قياس رسمية أو توقعًا.
          </p>
        </div>
        <div className="flex w-full rounded-xl border border-border bg-muted/40 p-1 sm:w-auto" role="group" aria-label="اختر برنامج عرض النتائج">
          {([
            ["qudrat", "القدرات"],
            ["tahsili", "التحصيلي"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              data-testid={`button-program-${value}`}
              aria-pressed={program === value}
              onClick={() => selectProgram(value)}
              className={`min-h-10 flex-1 rounded-lg px-4 text-sm font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-none ${
                program === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {trendState === "loading" ? (
          <div className="space-y-3" data-testid="progress-chart-loading" aria-label="تحميل سجل النتائج">
            <div className="h-48 animate-pulse rounded-2xl bg-muted/60" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted/60" />
          </div>
        ) : trendState === "error" ? (
          <StateMessage
            icon={AlertTriangle}
            title="تعذر عرض سجل النتائج"
            body="لم نتمكن من قراءة بيانات هذا المسار الآن. لا توجد نتائج بديلة أو تقديرية معروضة."
          />
        ) : trendState === "empty" || orderedPoints.length === 0 ? (
          <StateMessage
            icon={BarChart3}
            title="لا توجد نتائج محفوظة بعد"
            body={`عند حفظ نتيجة اختبار في مسار ${programName}، ستظهر دقّة الإجابة هنا.`}
          />
        ) : oneResult ? (
          <article data-testid="progress-chart-one-result" className="flex flex-col gap-4 rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground">نتيجة محفوظة واحدة في {programName}</p>
                <h4 className="mt-1 truncate font-black text-foreground">{orderedPoints[0].title}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(orderedPoints[0].date)}</p>
                {typeof orderedPoints[0].totalQuestions === "number" && (
                  <p className="mt-1 text-xs text-muted-foreground">{orderedPoints[0].totalQuestions.toLocaleString("ar-SA")} سؤالًا</p>
                )}
              </div>
            </div>
            <div className="shrink-0 rounded-xl border border-primary/15 bg-card px-5 py-3 text-center">
              <p className="text-[11px] font-bold text-muted-foreground">دقّة الإجابة</p>
              <p className="mt-1 text-2xl font-black tabular-nums text-primary">{orderedPoints[0].percentage.toLocaleString("ar-SA")}%</p>
            </div>
          </article>
        ) : trendState === "insufficient" ? (
          <StateMessage
            icon={BarChart3}
            title="نحتاج نتائج محفوظة إضافية"
            body={`توجد ${orderedPoints.length.toLocaleString("ar-SA")} نتائج محفوظة في مسار ${programName}؛ نعرضها دون رسم اتجاه حتى تتوفر بيانات كافية.`}
          />
        ) : canPlotLine ? (
          <>
            <div className="h-56 w-full sm:h-64" data-testid="progress-path-chart" role="img" aria-label={`رسم بياني لدقّة إجابات ${programName} عبر ${orderedPoints.length.toLocaleString("ar-SA")} نتائج محفوظة بترتيب زمني`}>
              <ResponsiveContainer width="100%" height="100%" debounce={0}>
                <LineChart data={orderedPoints} margin={{ top: 14, right: 8, left: 4, bottom: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 5" stroke={gridColor} />
                  <XAxis
                    dataKey="id"
                    tickFormatter={(value) => chartTickLabel(String(value), orderedPoints)}
                    tick={{ fontSize: 11, fill: tickColor }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={22}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fontSize: 11, fill: tickColor }}
                    tickFormatter={(value: number) => `${value}%`}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <Tooltip
                    content={<ScoreTooltip />}
                    isAnimationActive={false}
                    cursor={{ stroke: tickColor, strokeDasharray: "3 3" }}
                  />
                  <Line
                    type="linear"
                    dataKey="percentage"
                    name="دقّة الإجابة"
                    stroke={chartColor}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: chartColor, stroke: "hsl(var(--card))", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: chartColor, stroke: "hsl(var(--card))", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <span>كل نقطة نتيجة محفوظة في {programName}، مرتبة من الأقدم إلى الأحدث. لا يتضمن الرسم نقاطًا تقديرية.</span>
            </div>
          </>
        ) : (
          <StateMessage
            icon={LoaderCircle}
            title="لا يمكن رسم الاتجاه الآن"
            body="حالة سجل النتائج لا تسمح برسم خط. تظهر هنا النتائج المحفوظة فقط."
          />
        )}
      </div>
    </section>
  );
}
