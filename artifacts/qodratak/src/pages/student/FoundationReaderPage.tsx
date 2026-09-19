import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileText,
  HelpCircle,
  Lightbulb,
  List,
  Loader2,
  LockKeyhole,
  PlayCircle,
  RotateCcw,
  Send,
  Target,
  Eraser,
  Highlighter,
  MessageSquareText,
  PenLine,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";
import {
  useFoundationPractice,
  useLearningContent,
  useLearningContentProgress,
  useUpdateLearningContentProgress,
  useCompleteLearningContent,
  useSubmitFoundationPractice,
  useLearningContentAnnotations,
  useCreateLearningContentAnnotation,
  useDeleteLearningContentAnnotation,
  type LearningContentAnnotation,
  type LearningContentAnnotationData,
  type LearningContentAnnotationType,
} from "@/hooks/use-student";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  FoundationAnnotationSurface,
  type FoundationAnnotationTool,
} from "@/components/student/FoundationAnnotationSurface";
import { getCurrentTextSelection } from "@/lib/foundationAnnotations";

type ContentStatus = "draft" | "published" | "archived" | string;
type ProgressState = "NOT_STARTED" | "READING" | "COMPLETED" | "PRACTICE_COMPLETED";

type ReaderSection = {
  id: string;
  type: string;
  title?: string;
  body?: string;
  problem?: string;
  thinking?: string;
  solution?: string;
  why?: string;
};

type LearningContent = {
  id: string;
  programId: string;
  subjectId?: string;
  taxonomyNodeId?: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  sections: ReaderSection[];
  status: ContentStatus;
  version: number;
  publishedAt?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  linkedQuizRoute?: string;
  hasPractice: boolean;
};

type LearningProgress = {
  contentId: string;
  contentVersion: number;
  currentSectionId?: string;
  progress: number;
  state: ProgressState;
  startedAt?: string;
  lastReadAt?: string;
  completedAt?: string;
  practiceCompletedAt?: string;
};

type PracticeQuestion = {
  questionId: string;
  text: string;
  options: string[];
  explanation?: string;
  imageUrl?: string;
  imageUrls?: string[];
};

type PracticeResponse = {
  question?: PracticeQuestion;
};

type PracticeAnswerResponse = {
  result: {
    isCorrect: boolean;
    explanation?: string;
    correction?: string;
    nextStep?: string;
    practiceCompletedAt?: string;
  };
};

type UpdateProgressPayload = {
  currentSectionId?: string;
  progress: number;
  state?: ProgressState;
};

type SubmitPracticePayload = {
  questionId: string;
  selectedOptionIndex: number;
};

type MutationOptions<T> = {
  onSuccess?: (response: T) => void;
  onError?: (error: Error) => void;
};

const sectionTypeLabels: Record<string, string> = {
  introduction: "تمهيد",
  explanation: "شرح",
  example: "مثال",
  problem: "تطبيق",
  practice: "تطبيق",
  summary: "خلاصة",
  conclusion: "خلاصة",
};

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function normalizeProgress(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return clampProgress(numeric <= 1 ? numeric * 100 : numeric);
}

function getSectionLabel(section: ReaderSection) {
  return section.title || sectionTypeLabels[section.type.toLowerCase()] || "قسم القراءة";
}

function TextBlock({ children, className }: { children?: string; className?: string }) {
  if (!children?.trim()) return null;
  return (
    <p className={cn("whitespace-pre-line text-[1.04rem] leading-[2.1] text-[hsl(var(--reader-ink)/0.88)]", className)}>
      {children}
    </p>
  );
}

function ReaderSkeleton() {
  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl animate-pulse bg-[hsl(var(--reader-paper))] px-4 py-5 sm:px-8 lg:px-12" dir="rtl" aria-label="جارٍ تحميل المحتوى">
      <div className="h-10 w-28 rounded-full bg-[hsl(var(--reader-line))]" />
      <div className="mt-12 max-w-3xl space-y-4">
        <div className="h-4 w-28 rounded-full bg-[hsl(var(--reader-line))]" />
        <div className="h-12 w-4/5 rounded-2xl bg-[hsl(var(--reader-line))]" />
        <div className="h-5 w-3/5 rounded-full bg-[hsl(var(--reader-line))]" />
      </div>
      <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-5">
          <div className="h-32 rounded-[1.5rem] bg-[hsl(var(--reader-line))]" />
          <div className="h-80 rounded-[1.5rem] bg-[hsl(var(--reader-line))]" />
        </div>
        <div className="hidden h-64 rounded-[1.5rem] bg-[hsl(var(--reader-line))] lg:block" />
      </div>
    </div>
  );
}

function ReaderUnavailable({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--reader-paper))] px-5 py-12 text-center" dir="rtl">
      <section className="w-full max-w-md rounded-[1.75rem] border border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-surface))] p-7 shadow-[0_12px_36px_hsl(var(--reader-ink)/0.05)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--reader-accent-soft))] text-[hsl(var(--reader-accent))]">
          <CircleAlert className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl font-black text-[hsl(var(--reader-ink))]">تعذر فتح المحتوى</h1>
        <p className="mt-2 text-sm leading-7 text-[hsl(var(--reader-muted))]">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {onRetry ? (
            <Button type="button" onClick={onRetry} className="min-h-11 rounded-xl bg-[hsl(var(--reader-ink))] px-5 hover:bg-[hsl(var(--reader-ink)/0.9)]">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              إعادة المحاولة
            </Button>
          ) : null}
          <Button asChild type="button" variant="outline" className="min-h-11 rounded-xl border-[hsl(var(--reader-line))]">
            <Link href="/foundation">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              العودة إلى التأسيس
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function VideoPanel({ content }: { content: LearningContent }) {
  if (!content.videoUrl) return null;

  return (
    <section aria-labelledby="video-heading" className="overflow-hidden rounded-[1.5rem] border border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-ink))]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white sm:px-5">
        <h2 id="video-heading" className="flex items-center gap-2 text-sm font-black">
          <PlayCircle className="h-4 w-4 text-[hsl(var(--reader-accent))]" aria-hidden="true" />
          الفيديو المصاحب
        </h2>
        <a
          href={content.videoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--reader-accent))]"
        >
          فتح في نافذة جديدة
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
      <div className="aspect-video bg-[#13252a]">
        <iframe
          title={`الفيديو المصاحب لـ ${content.title}`}
          src={content.videoUrl}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </section>
  );
}

function SectionCard({
  section,
  index,
  isCurrent,
  sectionRef,
  annotationRootRef,
  annotations,
  activeTool,
  onDrawingComplete,
  onDeleteAnnotation,
  onSelect,
}: {
  section: ReaderSection;
  index: number;
  isCurrent: boolean;
  sectionRef: (node: HTMLDivElement | null) => void;
  annotationRootRef: (node: HTMLDivElement | null) => void;
  annotations: LearningContentAnnotation[];
  activeTool: FoundationAnnotationTool;
  onDrawingComplete: (data: LearningContentAnnotationData) => void;
  onDeleteAnnotation: (annotationId: string) => void;
  onSelect: () => void;
}) {
  const contentParts = [
    { label: "المسألة", value: section.problem, icon: FileText },
    { label: "فكّر قبل الحل", value: section.thinking, icon: Lightbulb },
    { label: "الحل", value: section.solution, icon: CheckCircle2 },
    { label: "لماذا؟", value: section.why, icon: HelpCircle },
  ];

  return (
    <article
      ref={sectionRef}
      id={`section-${section.id}`}
      tabIndex={-1}
      className={cn(
        "scroll-mt-28 rounded-[1.5rem] border bg-[hsl(var(--reader-surface))] p-5 outline-none transition-[border-color,box-shadow,background-color] duration-200 sm:p-8",
        isCurrent
          ? "border-[hsl(var(--reader-accent)/0.7)] bg-[hsl(var(--reader-accent-soft)/0.4)] shadow-[0_10px_30px_hsl(var(--reader-accent)/0.07)]"
          : "border-[hsl(var(--reader-line))]",
      )}
    >
      <FoundationAnnotationSurface
        sectionId={section.id}
        annotations={annotations}
        activeTool={activeTool}
        onSurfaceRef={annotationRootRef}
        onDrawingComplete={onDrawingComplete}
        onDeleteAnnotation={onDeleteAnnotation}
      >
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={onSelect}
            aria-label={`تحديد ${getSectionLabel(section)}`}
            aria-pressed={isCurrent}
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--reader-accent))] focus-visible:ring-offset-2",
              isCurrent
                ? "border-[hsl(var(--reader-accent))] bg-[hsl(var(--reader-accent))] text-[hsl(var(--reader-ink))]"
                : "border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-paper))] text-[hsl(var(--reader-muted))] hover:border-[hsl(var(--reader-accent)/0.6)]",
            )}
          >
            {index + 1}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-wide text-[hsl(var(--reader-muted))]">{sectionTypeLabels[section.type.toLowerCase()] || section.type}</p>
            <h2 className="mt-1 text-xl font-black leading-9 text-[hsl(var(--reader-ink))] sm:text-2xl">{getSectionLabel(section)}</h2>
          </div>
        </div>

        <div className="mr-14 mt-5 space-y-5">
          <TextBlock>{section.body}</TextBlock>
          {contentParts.map(({ label, value, icon: Icon }) =>
            value?.trim() ? (
              <div key={label} className="rounded-2xl border border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-paper)/0.75)] p-4 sm:p-5">
                <h3 className="flex items-center gap-2 text-sm font-black text-[hsl(var(--reader-ink))]">
                  <Icon className="h-4 w-4 text-[hsl(var(--reader-accent-dark))]" aria-hidden="true" />
                  {label}
                </h3>
                <TextBlock className="mt-2 text-[0.98rem]">{value}</TextBlock>
              </div>
            ) : null,
          )}
        </div>
      </FoundationAnnotationSurface>
    </article>
  );
}

function PracticePanel({
  contentId,
  open,
  onClose,
}: {
  contentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const practiceQuery = useFoundationPractice(contentId, open);
  const submitPractice = useSubmitFoundationPractice(contentId);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<PracticeAnswerResponse["result"] | null>(null);

  const practice = practiceQuery.data as unknown as PracticeResponse | undefined;
  const question = practice?.question;
  const submit = submitPractice.mutate as unknown as (
    payload: SubmitPracticePayload,
    options?: MutationOptions<PracticeAnswerResponse>,
  ) => void;

  useEffect(() => {
    if (!open) {
      setSelectedOption(null);
      setResult(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!question || selectedOption === null || submitPractice.isPending) return;
    submit(
      { questionId: question.questionId, selectedOptionIndex: selectedOption },
      {
        onSuccess: (response) => setResult(response.result),
      },
    );
  };

  return (
    <section id="practice" aria-labelledby="practice-heading" className="scroll-mt-28 rounded-[1.5rem] border-2 border-[hsl(var(--reader-accent)/0.55)] bg-[hsl(var(--reader-accent-soft)/0.42)] p-5 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-wide text-[hsl(var(--reader-accent-dark))]">تطبيق قصير</p>
          <h2 id="practice-heading" className="mt-1 text-xl font-black text-[hsl(var(--reader-ink))]">اختبر فهمك</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm font-bold text-[hsl(var(--reader-muted))] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--reader-accent))]"
        >
          إخفاء
        </button>
      </div>

      {practiceQuery.isLoading ? (
        <div className="mt-6 space-y-3" aria-label="جارٍ تحميل التدريب">
          <div className="h-5 w-4/5 animate-pulse rounded-full bg-[hsl(var(--reader-line))]" />
          <div className="h-12 animate-pulse rounded-xl bg-[hsl(var(--reader-line))]" />
          <div className="h-12 animate-pulse rounded-xl bg-[hsl(var(--reader-line))]" />
        </div>
      ) : practiceQuery.isError ? (
        <div className="mt-5 rounded-xl border border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-surface))] p-4">
          <p className="text-sm font-bold text-[hsl(var(--reader-ink))]">تعذر تحميل التدريب لهذا المحتوى.</p>
          <Button type="button" variant="outline" onClick={() => void practiceQuery.refetch()} className="mt-3 min-h-10 rounded-xl">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            حاول مرة أخرى
          </Button>
        </div>
      ) : !question ? (
        <p className="mt-5 rounded-xl border border-dashed border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-surface))] p-4 text-sm leading-7 text-[hsl(var(--reader-muted))]">
          لا يوجد تدريب متاح لهذا المحتوى حاليًا.
        </p>
      ) : result ? (
        <div className="mt-6 rounded-2xl border border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-surface))] p-5">
          <div className="flex items-start gap-3">
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", result.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800")}>
              {result.isCorrect ? <Check className="h-5 w-5" aria-hidden="true" /> : <CircleAlert className="h-5 w-5" aria-hidden="true" />}
            </span>
            <div>
              <h3 className="font-black text-[hsl(var(--reader-ink))]">{result.isCorrect ? "إجابتك صحيحة" : "راجع طريقة التفكير"}</h3>
              <p className="mt-1 text-sm leading-7 text-[hsl(var(--reader-muted))]">
                {result.explanation || result.correction || result.nextStep || "يمكنك متابعة القراءة ثم العودة إلى التدريب مرة أخرى."}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => { setResult(null); setSelectedOption(null); }} className="mt-5 min-h-11 rounded-xl">
            سؤال آخر
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-[1.04rem] font-bold leading-8 text-[hsl(var(--reader-ink))]">{question.text}</p>
          {question.imageUrl ? <img src={question.imageUrl} alt="" className="mt-4 max-h-72 w-full rounded-xl object-contain" /> : null}
          {question.imageUrls?.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {question.imageUrls.map((imageUrl) => <img key={imageUrl} src={imageUrl} alt="" className="max-h-60 w-full rounded-xl object-contain" />)}
            </div>
          ) : null}
          <fieldset className="mt-5 grid gap-3">
            <legend className="sr-only">خيارات الإجابة</legend>
            {question.options.map((option, index) => (
              <button
                key={`${question.questionId}-${index}`}
                type="button"
                aria-pressed={selectedOption === index}
                onClick={() => setSelectedOption(index)}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-right text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--reader-accent))] focus-visible:ring-offset-2",
                  selectedOption === index
                    ? "border-[hsl(var(--reader-accent))] bg-[hsl(var(--reader-accent)/0.16)] text-[hsl(var(--reader-ink))]"
                    : "border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-surface))] text-[hsl(var(--reader-ink))] hover:border-[hsl(var(--reader-accent)/0.6)]",
                )}
              >
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs", selectedOption === index ? "bg-[hsl(var(--reader-accent))] text-[hsl(var(--reader-ink))]" : "bg-[hsl(var(--reader-paper))] text-[hsl(var(--reader-muted))]")}>
                  {index + 1}
                </span>
                <span>{option}</span>
              </button>
            ))}
          </fieldset>
          {submitPractice.isError ? <p className="mt-3 text-sm font-bold text-destructive">{(submitPractice.error as Error).message}</p> : null}
          <Button type="button" onClick={handleSubmit} disabled={selectedOption === null || submitPractice.isPending} className="mt-5 min-h-11 rounded-xl bg-[hsl(var(--reader-ink))] px-5 hover:bg-[hsl(var(--reader-ink)/0.9)]">
            {submitPractice.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            إرسال الإجابة
          </Button>
        </div>
      )}
    </section>
  );
}

type AnnotationPayload = {
  contentVersion: number;
  sectionId?: string;
  type: LearningContentAnnotationType;
  data: LearningContentAnnotationData;
};

type AnnotationAction = {
  id: string;
  payload: AnnotationPayload;
};

function AnnotationToolbar({
  activeTool,
  onToolChange,
  onHighlight,
  onUnderline,
  onNote,
  onUndo,
  onRedo,
  onErase,
  onRetryFailed,
  canUndo,
  canRedo,
  pendingCount,
  failedCount,
}: {
  activeTool: FoundationAnnotationTool;
  onToolChange: (tool: FoundationAnnotationTool) => void;
  onHighlight: () => void;
  onUnderline: () => void;
  onNote: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onErase: () => void;
  onRetryFailed: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pendingCount: number;
  failedCount: number;
}) {
  const toolButton = (
    tool: FoundationAnnotationTool,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    onClick?: () => void,
  ) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={activeTool === tool}
      title={label}
      onClick={onClick || (() => onToolChange(tool))}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--reader-accent))]",
        activeTool === tool
          ? "bg-[hsl(var(--reader-ink))] text-white"
          : "text-[hsl(var(--reader-muted))] hover:bg-[hsl(var(--reader-paper))] hover:text-[hsl(var(--reader-ink))]",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="border-b border-[hsl(var(--reader-line)/0.9)] bg-[hsl(var(--reader-surface)/0.96)] px-4 py-2 backdrop-blur-md sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto" dir="rtl" aria-label="أدوات annotations">
        <span className="ml-1 shrink-0 text-[0.68rem] font-black text-[hsl(var(--reader-muted))]">أدوات الكتاب</span>
        {toolButton("READ", "قراءة", BookOpen)}
        {toolButton("PEN", "قلم", PenLine)}
        {toolButton("HIGHLIGHT", "تمييز", Highlighter, onHighlight)}
        {toolButton("UNDERLINE", "تسطير", Underline, onUnderline)}
        {toolButton("NOTE", "ملاحظة", MessageSquareText, onNote)}
        <span className="mx-1 h-5 w-px shrink-0 bg-[hsl(var(--reader-line))]" aria-hidden="true" />
        <button
          type="button"
          aria-label="تراجع"
          title="تراجع"
          disabled={!canUndo}
          onClick={onUndo}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-black text-[hsl(var(--reader-muted))] hover:bg-[hsl(var(--reader-paper))] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">تراجع</span>
        </button>
        <button
          type="button"
          aria-label="إعادة"
          title="إعادة"
          disabled={!canRedo}
          onClick={onRedo}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-black text-[hsl(var(--reader-muted))] hover:bg-[hsl(var(--reader-paper))] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Redo2 className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">إعادة</span>
        </button>
        {toolButton("ERASE", "مسح", Eraser, onErase)}
        {pendingCount ? <span className="mr-auto shrink-0 text-[0.68rem] font-bold text-[hsl(var(--reader-accent-dark))]">جارٍ الحفظ: {pendingCount}</span> : null}
        {failedCount ? (
          <button type="button" onClick={onRetryFailed} className="mr-auto shrink-0 rounded-md px-1 text-[0.68rem] font-bold text-destructive underline-offset-2 hover:underline">
            تعذر الحفظ: {failedCount} — أعد المحاولة
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function FoundationReaderPage() {
  const params = useParams<{ contentId?: string }>();
  const contentId = params.contentId || "";
  const contentQuery = useLearningContent(contentId);
  const progressQuery = useLearningContentProgress(contentId);
  const updateProgress = useUpdateLearningContentProgress(contentId);
  const completeContent = useCompleteLearningContent(contentId);
  const annotationQuery = useLearningContentAnnotations(contentId);
  const createAnnotation = useCreateLearningContentAnnotation(contentId);
  const deleteAnnotation = useDeleteLearningContentAnnotation(contentId);
  const [currentSectionId, setCurrentSectionId] = useState<string | undefined>();
  const [localProgress, setLocalProgress] = useState<number | null>(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<FoundationAnnotationTool>("READ");
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [annotationMessage, setAnnotationMessage] = useState<string | null>(null);
  const [pendingAnnotations, setPendingAnnotations] = useState<Record<string, { annotation: LearningContentAnnotation; payload: AnnotationPayload }>>({});
  const [undoStack, setUndoStack] = useState<AnnotationAction[]>([]);
  const [redoStack, setRedoStack] = useState<AnnotationAction[]>([]);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const annotationSectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cancelledPendingIds = useRef(new Set<string>());

  const content = contentQuery.data as unknown as LearningContent | undefined;
  const savedProgress = progressQuery.data as unknown as LearningProgress | undefined;
  const sections = useMemo(() => content?.sections || [], [content?.sections]);
  const currentId = currentSectionId || savedProgress?.currentSectionId || sections[0]?.id;
  const currentIndex = Math.max(0, sections.findIndex((section) => section.id === currentId));
  const savedPercent = normalizeProgress(savedProgress?.progress);
  const progressPercent = localProgress ?? savedPercent;
  const isContentCompleted = completeContent.isSuccess || savedProgress?.state === "COMPLETED" || savedProgress?.state === "PRACTICE_COMPLETED";
  const isPracticeCompleted = savedProgress?.state === "PRACTICE_COMPLETED" || Boolean(savedProgress?.practiceCompletedAt);
  const serverAnnotations = annotationQuery.data?.annotations || [];
  const annotations = useMemo(
    () => [...serverAnnotations, ...Object.values(pendingAnnotations).map((item) => item.annotation)],
    [pendingAnnotations, serverAnnotations],
  );
  const update = updateProgress.mutate as unknown as (payload: UpdateProgressPayload) => void;
  const complete = completeContent.mutate as unknown as (
    variables?: undefined,
    options?: MutationOptions<unknown>,
  ) => void;

  useEffect(() => {
    if (savedProgress?.currentSectionId && !currentSectionId) setCurrentSectionId(savedProgress.currentSectionId);
    if (savedProgress && localProgress === null) setLocalProgress(savedPercent);
  }, [currentSectionId, localProgress, savedPercent, savedProgress]);

  useEffect(() => {
    if (annotationQuery.isError) {
      setAnnotationMessage("تعذر تحميل annotations المحفوظة؛ ستبقى التعديلات المحلية ظاهرة.");
    }
  }, [annotationQuery.isError]);

  if (!contentId) return <ReaderUnavailable message="رابط المحتوى غير مكتمل." />;
  if (contentQuery.isLoading || progressQuery.isLoading) return <ReaderSkeleton />;
  if (contentQuery.isError || progressQuery.isError) {
    return (
      <ReaderUnavailable
        message={(contentQuery.error as Error)?.message || (progressQuery.error as Error)?.message || "تعذر تحميل هذا المحتوى."}
        onRetry={() => {
          void contentQuery.refetch();
          void progressQuery.refetch();
        }}
      />
    );
  }
  if (!content) return <ReaderUnavailable message="المحتوى المطلوب غير موجود." />;
  if (content.status && !["published", "PUBLISHED", "active"].includes(content.status)) {
    return <ReaderUnavailable message="هذا المحتوى غير متاح للقراءة الآن." />;
  }

  const createLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const persistAnnotation = (
    payload: AnnotationPayload,
    onSaved?: () => void,
    historyId?: string,
  ) => {
    const localId = historyId || createLocalId();
    const optimistic: LearningContentAnnotation = {
      id: localId,
      contentId,
      contentVersion: payload.contentVersion,
      sectionId: payload.sectionId,
      type: payload.type,
      data: payload.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: "pending",
    };
    setPendingAnnotations((current) => ({ ...current, [localId]: { annotation: optimistic, payload } }));
    createAnnotation.mutate(payload, {
      onSuccess: (saved) => {
        setPendingAnnotations((current) => {
          const next = { ...current };
          delete next[localId];
          return next;
        });
        setUndoStack((current) => current.map((action) => action.id === localId ? { ...action, id: saved.id } : action));
        if (cancelledPendingIds.current.has(localId)) {
          cancelledPendingIds.current.delete(localId);
          deleteAnnotation.mutate(saved.id);
        }
        onSaved?.();
      },
      onError: (error) => {
        setPendingAnnotations((current) => {
          const item = current[localId];
          if (!item) return current;
          return {
            ...current,
            [localId]: {
              ...item,
              annotation: { ...item.annotation, syncState: "failed" },
            },
          };
        });
        setAnnotationMessage(error.message || "تعذر حفظ annotation؛ ما زالت محفوظة محليًا.");
      },
    });
    return localId;
  };

  const pushAnnotationAction = (payload: AnnotationPayload) => {
    const id = persistAnnotation(payload);
    setUndoStack((current) => [...current, { id, payload }]);
    setRedoStack([]);
  };

  const sectionFromSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const commonAncestor = selection.getRangeAt(0).commonAncestorContainer;
    return Object.entries(annotationSectionRefs.current).find(([, root]) => root?.contains(commonAncestor))?.[0] || null;
  };

  const createTextAnnotation = (type: "HIGHLIGHT" | "UNDERLINE") => {
    const sectionId = sectionFromSelection();
    const root = sectionId ? annotationSectionRefs.current[sectionId] : null;
    const selection = getCurrentTextSelection(root);
    if (!sectionId || !selection) {
      setAnnotationMessage("حدد نصًا داخل قسم واحد أولًا.");
      return;
    }
    if (selection.selectedText.length > 600) {
      setAnnotationMessage("حدد مقطعًا أقصر من النص حتى يبقى annotation خفيفًا.");
      return;
    }
    pushAnnotationAction({
      contentVersion: content.version,
      sectionId,
      type,
      data: selection,
    });
    window.getSelection()?.removeAllRanges();
    setActiveTool("READ");
    setAnnotationMessage(type === "HIGHLIGHT" ? "تم حفظ التمييز." : "تم حفظ التسطير.");
  };

  const createNote = () => {
    const text = noteDraft.trim();
    if (!text) {
      setAnnotationMessage("اكتب الملاحظة قبل حفظها.");
      return;
    }
    const sectionId = sectionFromSelection() || currentId || sections[0]?.id;
    const root = sectionId ? annotationSectionRefs.current[sectionId] : null;
    const selection = getCurrentTextSelection(root);
    const data: LearningContentAnnotationData = {
      text,
      ...(selection && selection.selectedText.length <= 600 ? selection : {}),
    };
    pushAnnotationAction({ contentVersion: content.version, sectionId, type: "NOTE", data });
    setNoteDraft("");
    setNoteOpen(false);
    setActiveTool("READ");
    window.getSelection()?.removeAllRanges();
    setAnnotationMessage("تم حفظ الملاحظة.");
  };

  const deleteOneAnnotation = (annotationId: string) => {
    if (annotationId.startsWith("local-")) {
      cancelledPendingIds.current.add(annotationId);
      setPendingAnnotations((current) => {
        const next = { ...current };
        delete next[annotationId];
        return next;
      });
      return;
    }
    deleteAnnotation.mutate(annotationId, {
      onError: (error) => setAnnotationMessage(error.message || "تعذر حذف annotation."),
    });
  };

  const undo = () => {
    const action = undoStack.at(-1);
    if (!action) return;
    setUndoStack((current) => current.slice(0, -1));
    setRedoStack((current) => [...current, action]);
    deleteOneAnnotation(action.id);
    setAnnotationMessage("تم التراجع عن آخر annotation.");
  };

  const redo = () => {
    const action = redoStack.at(-1);
    if (!action) return;
    setRedoStack((current) => current.slice(0, -1));
    const newId = persistAnnotation(action.payload);
    setUndoStack((current) => [...current, { ...action, id: newId }]);
    setAnnotationMessage("تمت إعادة annotation.");
  };

  const retryFailedAnnotations = () => {
    Object.entries(pendingAnnotations)
      .filter(([, item]) => item.annotation.syncState === "failed")
      .forEach(([id, item]) => persistAnnotation(item.payload, undefined, id));
    setAnnotationMessage("تجري إعادة حفظ annotations الفاشلة.");
  };

  const selectSection = (sectionId: string) => {
    const nextIndex = sections.findIndex((section) => section.id === sectionId);
    if (nextIndex < 0) return;
    const nextProgress = sections.length > 1 ? Math.round((nextIndex / (sections.length - 1)) * 100) : 100;
    setCurrentSectionId(sectionId);
    setLocalProgress(Math.max(progressPercent, nextProgress));
    update({ currentSectionId: sectionId, progress: Math.max(progressPercent, nextProgress), state: "READING" });
    window.requestAnimationFrame(() => sectionRefs.current[sectionId]?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const resumeReading = () => {
    const target = currentId || sections[0]?.id;
    if (target) {
      sectionRefs.current[target]?.scrollIntoView({ behavior: "smooth", block: "start" });
      sectionRefs.current[target]?.focus({ preventScroll: true });
    }
  };

  const markComplete = () => {
    if (completeContent.isPending || isContentCompleted) return;
    complete(undefined, {
      onSuccess: () => {
        setLocalProgress(100);
        setCurrentSectionId(sections.at(-1)?.id);
      },
    });
  };

  return (
    <main
      dir="rtl"
      className="min-h-[100dvh] bg-[hsl(var(--reader-paper))] text-[hsl(var(--reader-ink))] [--reader-accent:38_72%_58%] [--reader-accent-dark:31_62%_39%] [--reader-accent-soft:39_68%_91%] [--reader-ink:187_34%_19%] [--reader-muted:187_10%_45%] [--reader-paper:40_33%_96%] [--reader-surface:39_45%_99%] [--reader-line:38_22%_86%]"
    >
      <div className="sticky top-0 z-20 border-b border-[hsl(var(--reader-line)/0.9)] bg-[hsl(var(--reader-paper)/0.94)] backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
          <Link href="/foundation" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-[hsl(var(--reader-muted))] transition-colors hover:bg-[hsl(var(--reader-surface))] hover:text-[hsl(var(--reader-ink))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--reader-accent))]">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">التأسيس</span>
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--reader-accent))] text-[hsl(var(--reader-ink))] sm:flex">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="truncate text-sm font-black text-[hsl(var(--reader-ink))]">{content.title}</p>
          </div>
          <span className="shrink-0 text-xs font-bold text-[hsl(var(--reader-muted))]">{Math.round(progressPercent)}٪</span>
        </div>
        <Progress value={progressPercent} className="h-1 rounded-none bg-[hsl(var(--reader-line))] [&>div]:bg-[hsl(var(--reader-accent-dark))]" aria-label="نسبة قراءة المحتوى" />
      </div>
      <AnnotationToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onHighlight={() => { setActiveTool("HIGHLIGHT"); createTextAnnotation("HIGHLIGHT"); }}
        onUnderline={() => { setActiveTool("UNDERLINE"); createTextAnnotation("UNDERLINE"); }}
        onNote={() => { setActiveTool("NOTE"); setNoteOpen(true); }}
        onUndo={undo}
        onRedo={redo}
        onErase={() => setActiveTool("ERASE")}
        onRetryFailed={retryFailedAnnotations}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        pendingCount={Object.values(pendingAnnotations).filter(({ annotation }) => annotation.syncState === "pending").length}
        failedCount={Object.values(pendingAnnotations).filter(({ annotation }) => annotation.syncState === "failed").length}
      />
      {noteOpen ? (
        <div className="border-b border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-accent-soft)/0.45)] px-4 py-3 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-end" dir="rtl">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-xs font-black text-[hsl(var(--reader-ink))]">ملاحظة شخصية</span>
              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value.slice(0, 2000))}
                maxLength={2000}
                rows={2}
                autoFocus
                placeholder="اكتب ملاحظة مرتبطة بهذا القسم..."
                className="w-full resize-y rounded-xl border border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-surface))] px-3 py-2 text-sm leading-7 outline-none focus:border-[hsl(var(--reader-accent-dark))] focus:ring-2 focus:ring-[hsl(var(--reader-accent)/0.25)]"
              />
            </label>
            <div className="flex shrink-0 gap-2">
              <Button type="button" onClick={createNote} className="min-h-10 rounded-xl bg-[hsl(var(--reader-ink))]">حفظ الملاحظة</Button>
              <Button type="button" variant="outline" onClick={() => { setNoteOpen(false); setActiveTool("READ"); }} className="min-h-10 rounded-xl">إلغاء</Button>
            </div>
          </div>
        </div>
      ) : null}
      {annotationMessage ? (
        <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-8 lg:px-12" dir="rtl">
          <p className="text-xs font-bold text-[hsl(var(--reader-muted))]" aria-live="polite">{annotationMessage}</p>
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8 sm:pt-12 lg:px-12">
        <header className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-black text-[hsl(var(--reader-muted))]">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              قراءة موجهة
            </span>
            {content.estimatedMinutes ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {content.estimatedMinutes} دقيقة
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 text-[clamp(2rem,6vw,4.2rem)] font-black leading-[1.2] tracking-tight text-[hsl(var(--reader-ink))]">{content.title}</h1>
          {content.description ? <p className="mt-5 max-w-2xl whitespace-pre-line text-base leading-8 text-[hsl(var(--reader-muted))] sm:text-lg">{content.description}</p> : null}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {sections.length > 0 && savedProgress?.state !== "NOT_STARTED" ? (
              <Button type="button" onClick={resumeReading} className="min-h-11 rounded-xl bg-[hsl(var(--reader-ink))] px-5 hover:bg-[hsl(var(--reader-ink)/0.9)]">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                متابعة القراءة
              </Button>
            ) : null}
            {content.hasPractice ? (
              <Button type="button" variant="outline" onClick={() => { setPracticeOpen(true); window.requestAnimationFrame(() => document.getElementById("practice")?.scrollIntoView({ behavior: "smooth", block: "start" })); }} className="min-h-11 rounded-xl border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-surface))]">
                <Target className="h-4 w-4" aria-hidden="true" />
                {isPracticeCompleted ? "التدريب مكتمل" : "انتقل إلى التدريب"}
              </Button>
            ) : null}
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="min-w-0 space-y-7">
            {!sections.length && !content.videoUrl ? (
              <section className="rounded-[1.5rem] border border-dashed border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-surface))] p-6 sm:p-8">
                <h2 className="flex items-center gap-2 text-lg font-black">
                  <FileText className="h-5 w-5 text-[hsl(var(--reader-accent-dark))]" aria-hidden="true" />
                  نبذة المحتوى
                </h2>
                <TextBlock className="mt-4">{content.description}</TextBlock>
              </section>
            ) : null}
            <VideoPanel content={content} />
            {sections.map((section, index) => (
              <SectionCard
                key={section.id}
                section={section}
                index={index}
                isCurrent={currentId === section.id}
                sectionRef={(node) => { sectionRefs.current[section.id] = node; }}
                annotationRootRef={(node) => { annotationSectionRefs.current[section.id] = node; }}
                annotations={annotations.filter((annotation) => annotation.sectionId === section.id)}
                activeTool={activeTool}
                onDrawingComplete={(data) => pushAnnotationAction({
                  contentVersion: content.version,
                  sectionId: section.id,
                  type: "DRAWING",
                  data,
                })}
                onDeleteAnnotation={deleteOneAnnotation}
                onSelect={() => selectSection(section.id)}
              />
            ))}
            {content.hasPractice ? <PracticePanel contentId={contentId} open={practiceOpen} onClose={() => setPracticeOpen(false)} /> : null}

            <section aria-labelledby="completion-heading" className="rounded-[1.5rem] border border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-surface))] p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", isContentCompleted ? "bg-emerald-100 text-emerald-700" : "bg-[hsl(var(--reader-accent-soft))] text-[hsl(var(--reader-accent-dark))]")}>
                    {isContentCompleted ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <LockKeyhole className="h-5 w-5" aria-hidden="true" />}
                  </span>
                  <div>
                    <h2 id="completion-heading" className="font-black text-[hsl(var(--reader-ink))]">{isContentCompleted ? "اكتمل المحتوى" : "أنهيت قراءة المحتوى؟"}</h2>
                    <p className="mt-1 text-sm leading-7 text-[hsl(var(--reader-muted))]">
                      {isPracticeCompleted ? "أكملت القراءة والتدريب لهذا المحتوى." : content.hasPractice ? "إتمام القراءة مستقل عن إتمام التدريب؛ أكمل كل خطوة في وقتها." : "سجّل إتمام القراءة عندما تصل إلى الفكرة الأخيرة."}
                    </p>
                  </div>
                </div>
                <Button type="button" onClick={markComplete} disabled={isContentCompleted || completeContent.isPending} className="min-h-11 shrink-0 rounded-xl bg-[hsl(var(--reader-ink))] px-5 hover:bg-[hsl(var(--reader-ink)/0.9)]">
                  {completeContent.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : isContentCompleted ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                  {isContentCompleted ? "تم تسجيل الإتمام" : "تسجيل إتمام القراءة"}
                </Button>
              </div>
              {completeContent.isError ? <p className="mt-4 text-sm font-bold text-destructive">{(completeContent.error as Error).message}</p> : null}
            </section>
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label="فهرس المحتوى">
            <div className="rounded-[1.5rem] border border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-surface))] p-4">
              <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--reader-line))] pb-4">
                <h2 className="flex items-center gap-2 text-sm font-black">
                  <List className="h-4 w-4 text-[hsl(var(--reader-accent-dark))]" aria-hidden="true" />
                  فهرس القراءة
                </h2>
                <span className="text-xs font-bold text-[hsl(var(--reader-muted))]">{sections.length} أقسام</span>
              </div>
              <nav className="mt-3 space-y-1">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => selectSection(section.id)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--reader-accent))]",
                      currentId === section.id ? "bg-[hsl(var(--reader-accent-soft))] text-[hsl(var(--reader-ink))]" : "text-[hsl(var(--reader-muted))] hover:bg-[hsl(var(--reader-paper))] hover:text-[hsl(var(--reader-ink))]",
                    )}
                  >
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[0.7rem]", currentId === section.id ? "bg-[hsl(var(--reader-accent))] text-[hsl(var(--reader-ink))]" : "bg-[hsl(var(--reader-paper))]")}>{index + 1}</span>
                    <span className="min-w-0 truncate">{getSectionLabel(section)}</span>
                  </button>
                ))}
              </nav>
              {sections.length ? (
                <div className="mt-5 border-t border-[hsl(var(--reader-line))] pt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-[hsl(var(--reader-muted))]">
                    <span>تقدم القراءة</span>
                    <span>{Math.round(progressPercent)}٪</span>
                  </div>
                  <Progress value={progressPercent} className="mt-2 h-2 bg-[hsl(var(--reader-line))] [&>div]:bg-[hsl(var(--reader-accent-dark))]" />
                </div>
              ) : null}
            </div>
            {content.linkedQuizRoute ? (
              <Link href={content.linkedQuizRoute} className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[hsl(var(--reader-line))] bg-[hsl(var(--reader-surface))] px-4 text-sm font-black text-[hsl(var(--reader-ink))] transition-colors hover:border-[hsl(var(--reader-accent)/0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--reader-accent))]">
                <span className="flex items-center gap-2"><Target className="h-4 w-4 text-[hsl(var(--reader-accent-dark))]" aria-hidden="true" />الاختبار المرتبط</span>
                <ChevronDown className="h-4 w-4 rotate-90" aria-hidden="true" />
              </Link>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}