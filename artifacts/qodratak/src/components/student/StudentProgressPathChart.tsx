import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Loader2, TrendingUp } from "lucide-react";
import { useFoundationLearningState } from "@/hooks/use-student";

type Program = "qudrat" | "tahsili";

interface StudentProgressPathChartProps {
  progress: {
    qudrat: { percentage: number; tests: number };
    tahsili: { percentage: number; tests: number };
  };
  targetScore?: number | null;
  initialProgram: Program;
  nextStepTitle: string;
  nextStepHref: string;
}

export default function StudentProgressPathChart({
  progress,
  targetScore,
  initialProgram,
  nextStepTitle,
  nextStepHref,
}: StudentProgressPathChartProps) {
  const [program, setProgram] = useState<Program>(initialProgram);
  const learningState = useFoundationLearningState(program);

  useEffect(() => {
    setProgram(initialProgram);
  }, [initialProgram]);

  const startScore = program === "qudrat"
    ? learningState.data?.baseline?.overall
    : learningState.data?.placementAssessment?.percentage;
  const currentProgress = progress[program];
  const currentScore = currentProgress.tests > 0 ? currentProgress.percentage : null;
  const validTarget = Number.isFinite(Number(targetScore)) && Number(targetScore) > 0 && Number(targetScore) <= 100
    ? Number(targetScore)
    : null;
  const chartData = [
    ...(startScore !== undefined && startScore !== null
      ? [{ phase: "بداية المسار", score: Math.max(0, Math.min(100, Math.round(startScore))) }]
      : []),
    ...(currentScore !== null
      ? [{ phase: "مستواك الآن", score: Math.max(0, Math.min(100, Math.round(currentScore))) }]
      : []),
  ];

  return (
    <section
      data-testid="student-progress-path"
      aria-labelledby="student-progress-path-title"
      className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6"
      dir="rtl"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-primary">رحلتك الدراسية</p>
          <h2 id="student-progress-path-title" className="mt-1 text-xl font-black text-foreground">
            من أين بدأت وإلى أين تتجه؟
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            نقاط واضحة من تقييم البداية ونتائجك المحفوظة، بدون توقعات غير مؤكدة.
          </p>
        </div>
        <div className="flex rounded-xl border border-border bg-muted/50 p-1" role="group" aria-label="اختر مسار التقدم">
          {([
            ["qudrat", "القدرات"],
            ["tahsili", "التحصيلي"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={program === value}
              onClick={() => setProgram(value)}
              className={`min-h-9 rounded-lg px-3 text-xs font-black transition ${
                program === value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {learningState.isLoading ? (
        <div className="mt-6 flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          جارٍ تحميل نقطة البداية…
        </div>
      ) : chartData.length === 0 ? (
        <div data-testid="empty-progress-path" className="mt-5 rounded-2xl border border-dashed border-border bg-muted/30 p-5">
          <p className="font-black text-foreground">نحدد نقطة البداية من أول تقييم</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            ابدأ تقييم {program === "qudrat" ? "القدرات" : "التحصيلي"}؛ بعدها يظهر مستواك الآن والخطوة التالية هنا.
          </p>
          <Link
            href={program === "qudrat" ? "/foundation?program=qudrat" : "/foundation?program=tahsili"}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground hover:opacity-90"
          >
            ابدأ التقييم <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/50 p-3">
              <p className="text-xs font-bold text-muted-foreground">بداية المسار</p>
              <p className="mt-1 text-xl font-black text-foreground">
                {startScore !== undefined && startScore !== null ? `${Math.round(startScore)}%` : "غير مسجلة"}
              </p>
            </div>
            <div className="rounded-2xl bg-primary/10 p-3">
              <p className="text-xs font-bold text-muted-foreground">مستواك الآن</p>
              <p className="mt-1 text-xl font-black text-foreground">{currentScore !== null ? `${Math.round(currentScore)}%` : "لم تبدأ الاختبار بعد"}</p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-3">
              <p className="text-xs font-bold text-muted-foreground">هدف الدرجة الذي سجلته</p>
              <p className="mt-1 text-xl font-black text-foreground">{validTarget !== null ? `${validTarget}%` : "لم تحدد هدفًا بعد"}</p>
            </div>
          </div>

          <div className="mt-4 h-52 w-full" data-testid="progress-path-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 14, right: 14, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11 }} tickFormatter={(value) => `${value}%`} width={42} />
                <Tooltip
                  formatter={(value) => [`${value}%`, "النتيجة"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    color: "hsl(var(--popover-foreground))",
                    borderRadius: 12,
                  }}
                />
                {validTarget !== null && (
                  <ReferenceLine
                    y={validTarget}
                    stroke="#D4A35B"
                    strokeDasharray="6 4"
                    label={{ value: `هدفك ${validTarget}%`, position: "insideTopRight", fill: "#A8792A", fontSize: 11 }}
                  />
                )}
                <Line
                  type="linear"
                  dataKey="score"
                  stroke="#F28370"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#F28370", stroke: "hsl(var(--card))", strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
              <TrendingUp className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {currentScore === null
                ? "أكمل أول اختبار لتظهر نقطة مستواك الحالي."
                : `الخطوة القادمة: ${nextStepTitle}`}
            </p>
            <Link
              href={nextStepHref}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-black text-foreground transition hover:border-primary/40 hover:bg-primary/5"
            >
              ابدأ الخطوة التالية <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
