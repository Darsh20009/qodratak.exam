import { CheckCircle2, ChevronLeft, LockKeyhole, Route } from "lucide-react";
import { Link } from "wouter";

export type WorkflowStage = "foundation" | "skills" | "banks" | "simulation";
export type WorkflowLevel = "foundation" | "practice" | "mastery";

type WorkflowStageConfig = {
  key: WorkflowStage;
  number: number;
  title: string;
  description: string;
  href: string;
};

const STAGES: WorkflowStageConfig[] = [
  {
    key: "foundation",
    number: 1,
    title: "التأسيس",
    description: "فيديو الدرس، أمثلة، تدريب قصير، واختبار تثبيت.",
    href: "/foundation?program=qudrat",
  },
  {
    key: "skills",
    number: 2,
    title: "التدريب المهاري",
    description: "تطبيق موجه على مهارات الكمي واللفظي.",
    href: "/computerized",
  },
  {
    key: "banks",
    number: 3,
    title: "بنوك الأقسام",
    description: "تدريب أوسع حسب القسم والمستوى ونقاط الضعف.",
    href: "/question-bank",
  },
  {
    key: "simulation",
    number: 4,
    title: "المحاكاة والاحتراف",
    description: "اختبارات كاملة بوقت وتحليل للأخطاء.",
    href: "/qiyas",
  },
];

const LEVEL_LABELS: Record<WorkflowLevel, string> = {
  foundation: "تحتاج تأسيسًا مرتبًا",
  practice: "في مرحلة التدريب المركز",
  mastery: "جاهز للمحاكاة والمراجعة",
};

function stageIndex(stage: WorkflowStage) {
  return STAGES.findIndex((item) => item.key === stage);
}

export function workflowStageForLevel(level: WorkflowLevel): WorkflowStage {
  if (level === "mastery") return "simulation";
  if (level === "practice") return "skills";
  return "foundation";
}

export function StudentWorkflow({
  currentStage,
  level,
  progress,
  focusLabel,
  nextAction,
}: {
  currentStage: WorkflowStage;
  level: WorkflowLevel;
  progress: number;
  focusLabel?: string;
  nextAction?: { label: string; href: string };
}) {
  const currentIndex = stageIndex(currentStage);
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress || 0)));

  return (
    <section className="rounded-3xl border border-[#DCE7E3] bg-[#F8FBFA] p-4 shadow-sm sm:p-5" aria-labelledby="student-workflow-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0D1B2A] text-[#F7F775]">
            <Route className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-black text-[#147D68]">مسار الطالب</p>
            <h2 id="student-workflow-title" className="mt-1 text-lg font-black text-[#0D1B2A]">
              أنت الآن في: {STAGES[currentIndex]?.title || "التأسيس"}
            </h2>
            <p className="mt-1 text-xs leading-6 text-[#64748B]">
              {LEVEL_LABELS[level]}{focusLabel ? ` · التركيز الحالي: ${focusLabel}` : ""}
            </p>
          </div>
        </div>
        <div className="min-w-52 rounded-2xl border border-[#DCE7E3] bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-xs font-black">
            <span className="text-[#64748B]">تقدمك العام</span>
            <span className="text-[#147D68]">{safeProgress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7EFEC]">
            <div className="h-full rounded-full bg-[#147D68] transition-all" style={{ width: `${safeProgress}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAGES.map((stage, index) => {
          const isCurrent = index === currentIndex;
          const isComplete = index < currentIndex;
          const isLocked = index > currentIndex + 1;
          const stageContent = (
            <div
              className={`relative h-full rounded-2xl border p-3 transition ${
                isCurrent
                  ? "border-[#147D68] bg-white shadow-sm"
                  : isComplete
                    ? "border-[#B9DED2] bg-[#EFF9F5]"
                    : isLocked
                      ? "border-[#E2E8F0] bg-white/60 opacity-65"
                      : "border-[#E2E8F0] bg-white hover:border-[#147D68]/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                  isComplete
                    ? "bg-[#147D68] text-white"
                    : isCurrent
                      ? "bg-[#0D1B2A] text-[#F7F775]"
                      : "bg-[#EEF3F1] text-[#64748B]"
                }`}>
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : isLocked ? <LockKeyhole className="h-3.5 w-3.5" /> : stage.number}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#0D1B2A]">{stage.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#64748B]">
                    {isCurrent ? "المرحلة الحالية" : isComplete ? "مكتملة" : isLocked ? "تظهر بعد إكمال السابقة" : "الخطوة التالية"}
                  </p>
                </div>
              </div>
            </div>
          );

          return isLocked ? (
            <div key={stage.key}>{stageContent}</div>
          ) : (
            <Link key={stage.key} href={stage.href} data-testid={`link-workflow-${stage.key}`} className="block">
              {stageContent}
            </Link>
          );
        })}
      </div>

      {nextAction && (
        <div className="mt-4 flex flex-col gap-2 border-t border-[#DCE7E3] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-6 text-[#64748B]">
            لا يهم من أين بدأت؛ النظام يضعك في المرحلة المناسبة ثم ينقلك خطوة خطوة.
          </p>
          <Link href={nextAction.href} data-testid="link-workflow-next-action" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] px-4 py-2.5 text-xs font-black text-white">
            {nextAction.label}
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}