import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  CircleDashed,
  CircleHelp,
  Clock3,
  Route,
} from "lucide-react";
import { Link } from "wouter";
import {
  currentWorkflowStage,
  type StudentWorkflowStatuses,
  type WorkflowStage,
  type WorkflowStageStatus,
} from "@/lib/studentWorkflowProgress";

type WorkflowStageConfig = {
  key: WorkflowStage;
  title: string;
  description: string;
  href: string;
};

const STAGES: WorkflowStageConfig[] = [
  {
    key: "foundation",
    title: "التأسيس",
    description: "الدروس المنشورة التي يمكن متابعة تقدمها المحفوظ.",
    href: "/foundation?program=qudrat",
  },
  {
    key: "skills",
    title: "التدريب المهاري",
    description: "محاولات التدريب المسجلة للقدرات.",
    href: "/computerized",
  },
  {
    key: "banks",
    title: "بنوك الأقسام",
    description: "اختبارات الأقسام المحفوظة.",
    href: "/question-bank",
  },
  {
    key: "simulation",
    title: "المحاكاة والاحتراف",
    description: "اختبار محوسب محفوظ بنتيجته.",
    href: "/qiyas",
  },
];

const STATUS_LABELS: Record<WorkflowStageStatus, string> = {
  NOT_ASSESSED: "لم يُقيّم بعد",
  NOT_STARTED: "لم يبدأ",
  IN_PROGRESS: "قيد التقدم",
  COMPLETED: "مكتمل",
  NEEDS_REVIEW: "يحتاج مراجعة",
};

const STATUS_STYLES: Record<WorkflowStageStatus, string> = {
  NOT_ASSESSED: "border-border bg-card text-muted-foreground",
  NOT_STARTED: "border-border bg-card text-muted-foreground",
  IN_PROGRESS: "border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300",
  COMPLETED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  NEEDS_REVIEW: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
};

export function StudentWorkflow({
  statuses,
  focusLabel,
  nextAction,
}: {
  statuses: StudentWorkflowStatuses;
  focusLabel?: string;
  nextAction?: { label: string; href: string };
}) {
  const currentStage = currentWorkflowStage(statuses);
  const currentTitle = STAGES.find((stage) => stage.key === currentStage)?.title || "التأسيس";

  return (
    <section className="rounded-3xl border border-border bg-muted/40 p-4 shadow-sm sm:p-5" aria-labelledby="student-workflow-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0D1B2A] dark:bg-primary dark:text-primary-foreground text-[#F7F775]">
            <Route className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-black text-[#147D68] dark:text-emerald-400">مسار الطالب</p>
            <h2 id="student-workflow-title" className="mt-1 text-lg font-black text-foreground">
              خطوتك الحالية: {currentTitle}
            </h2>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              الحالات مبنية على الدروس والاختبارات المحفوظة، لا على المستوى العام.
              {focusLabel ? ` · التركيز الحالي: ${focusLabel}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAGES.map((stage) => {
          const status = statuses[stage.key];
          const isCurrent = stage.key === currentStage;
          const StatusIcon = status === "COMPLETED"
            ? CheckCircle2
            : status === "IN_PROGRESS"
              ? Clock3
              : status === "NEEDS_REVIEW"
                ? AlertTriangle
                : status === "NOT_ASSESSED"
                  ? CircleHelp
                  : CircleDashed;
          const stageContent = (
            <div
              className={`relative h-full rounded-2xl border p-3 transition ${STATUS_STYLES[status]} ${
                isCurrent ? "ring-2 ring-primary/30" : "hover:border-[#147D68]/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background/70">
                  <StatusIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black">{stage.title}</p>
                  <p className="mt-1 text-[11px] leading-5">
                    {isCurrent ? "الخطوة الحالية · " : ""}{STATUS_LABELS[status]}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-5 opacity-75">{stage.description}</p>
            </div>
          );

          return (
            <Link key={stage.key} href={stage.href} data-testid={`link-workflow-${stage.key}`} className="block">
              {stageContent}
            </Link>
          );
        })}
      </div>

      {nextAction && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-6 text-muted-foreground">
            يظل إكمال كل مرحلة مرتبطًا بدليل محفوظ، ويمكنك فتح أي مسار متاح.
          </p>
          <Link href={nextAction.href} data-testid="link-workflow-next-action" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] dark:bg-primary dark:text-primary-foreground px-4 py-2.5 text-xs font-black text-white">
            {nextAction.label}
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}