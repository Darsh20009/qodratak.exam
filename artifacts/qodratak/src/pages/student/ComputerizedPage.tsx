import { useCallback, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileQuestion,
  FileText,
  Flag,
  Layers3,
  Library,
  Search,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getGetQudratVerbalVideoProgressQueryKey,
  useGetQudratVerbalVideoProgress,
  useRecordQudratVerbalVideoProgress,
  type QudratVerbalVideoProgress,
  type QudratVerbalVideoProgressInput,
  type QudratVerbalVideoProgressSummary,
} from "@workspace/api-client-react";
import {
  useFoundationContent,
  useFoundationLearningState,
  useLearningContentProgressSummary,
  useStudentDashboard,
  type FoundationContent,
} from "@/hooks/use-student";
import { StudentWorkflow } from "@/components/student/StudentWorkflow";
import { resolveStudentWorkflowStatuses } from "@/lib/studentWorkflowProgress";
import { isDirectFoundationVideo, resolveFoundationAssetUrl } from "@/lib/foundationVideoUrl";
import { VerbalVideoProgressCard } from "@/components/student/VerbalVideoProgressCard";

type ComputerizedMode = "quantitative" | "verbal" | "exams" | "search";
type ComputerizedTrack = "qudrat" | "tahsili";

type ModeConfig = {
  key: ComputerizedMode;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  iconSurface: string;
};

type ContentItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  tag?: string;
};

const MODES: ModeConfig[] = [
  {
    key: "quantitative",
    title: "الكمي",
    description: "بنوك وفيديوهات واختبارات مرتبة حسب مهارات الكمي.",
    icon: Calculator,
    accent: "text-[#147D68] dark:text-emerald-400",
    iconSurface: "bg-emerald-500/10",
  },
  {
    key: "verbal",
    title: "اللفظي",
    description: "تدرّب على أقسام اللفظي من الشرح إلى الاختبار.",
    icon: BookOpen,
    accent: "text-[#3B67A5] dark:text-sky-400",
    iconSurface: "bg-sky-500/10",
  },
  {
    key: "exams",
    title: "الاختبارات",
    description: "المحاكاة والنماذج الورقية والمجدولة والمخصصة واختبارات الأقسام.",
    icon: Layers3,
    accent: "text-primary",
    iconSurface: "bg-primary/10",
  },
  {
    key: "search",
    title: "ابحث عن سؤال فقط",
    description: "انتقل مباشرة إلى السؤال الذي تريد مراجعته.",
    icon: Search,
    accent: "text-[#7A4B91] dark:text-fuchsia-400",
    iconSurface: "bg-fuchsia-500/10",
  },
];

const TRACKS: Array<{
  key: ComputerizedTrack;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    key: "qudrat",
    title: "قدرات",
    description: "الكمي واللفظي والاختبارات.",
    icon: Target,
  },
  {
    key: "tahsili",
    title: "تحصيلي",
    description: "المواد العلمية والبنوك والاختبارات الشاملة.",
    icon: BookOpen,
  },
];

const QUANTITATIVE_ITEMS: ContentItem[] = [
  {
    title: "الحساب والعمليات",
    description: "تدريب الحساب، الكسور، التقدير، وترتيب العمليات.",
    icon: Calculator,
  },
  {
    title: "النسبة والتناسب",
    description: "النسب، التناسب الطردي والعكسي، والتطبيقات اللفظية.",
    icon: Target,
  },
  {
    title: "النسبة المئوية",
    description: "الزيادة والنقصان والخصومات والنسب المركبة.",
    icon: Sparkles,
  },
  {
    title: "الجبر والمعادلات",
    description: "تبسيط العبارات، المعادلات، والمتغيرات.",
    icon: FileQuestion,
  },
  {
    title: "الهندسة",
    description: "الزوايا، المثلثات، المحيط، المساحة، والحجوم.",
    icon: Flag,
  },
  {
    title: "المقارنات",
    description: "استراتيجيات مقارنة الكميتين واختيار المعطى الكافي.",
    icon: CheckCircle2,
  },
  {
    title: "الإحصاء",
    description: "المتوسط والوسيط والمنوال وقراءة الجداول والرسوم.",
    icon: Trophy,
  },
  {
    title: "الحركة والأنماط",
    description: "السرعة، الزمن، المتتاليات، واكتشاف النمط.",
    icon: Clock3,
  },
  {
    title: "أفكار متنوعة",
    description: "أسئلة مركبة لتثبيت المهارات وربط أكثر من فكرة.",
    icon: Sparkles,
  },
];

const VERBAL_ITEMS: ContentItem[] = [
  {
    title: "التناظر اللفظي",
    description: "اكتشف العلاقة بين الكلمتين ثم طبّقها على الخيارات.",
    icon: Layers3,
  },
  {
    title: "إكمال الجمل",
    description: "افهم السياق واختر الكلمة أو العبارة التي تكمل المعنى.",
    icon: FileQuestion,
  },
  {
    title: "الخطأ السياقي",
    description: "حدّد الكلمة التي لا تنسجم مع معنى الجملة وسياقها.",
    icon: CircleHelp,
  },
  {
    title: "استيعاب المقروء",
    description: "اقرأ النص، استخرج فكرته، وأجب عن الأسئلة بدقة.",
    icon: BookOpen,
  },
  {
    title: "المفردة الشاذة",
    description: "ميّز الكلمة المختلفة عن المجموعة وفق العلاقة المشتركة.",
    icon: Search,
  },
  {
    title: "أفكار متنوعة",
    description: "تدريب شامل يربط بين مهارات القسم اللفظي.",
    icon: Sparkles,
  },
];

const VERBAL_COMPUTERIZED_FILES = [
  {
    id: "sentence-completion",
    section: "إكمال الجمل",
  },
  {
    id: "reading-comprehension",
    section: "استيعاب المقروء",
  },
  {
    id: "contextual-error",
    section: "الخطأ السياقي",
  },
  {
    id: "verbal-analogy",
    section: "التناظر اللفظي",
  },
] as const;

const VERBAL_ANALOGY_VIDEOS = [
  { id: "analogy-01", lesson: 1, duration: "59:33" },
  { id: "analogy-02", lesson: 2, duration: "50:40" },
  { id: "analogy-03", lesson: 3, duration: "41:49" },
  { id: "analogy-04", lesson: 4, duration: "43:58" },
  { id: "analogy-05", lesson: 5, duration: "40:43" },
  { id: "analogy-06", lesson: 6, duration: "33:36" },
] as const;

const VERBAL_SENTENCE_COMPLETION_VIDEOS = [
  { id: "sentence-completion-01", lesson: 1, duration: "49:58" },
  { id: "sentence-completion-02", lesson: 2, duration: "46:04" },
  { id: "sentence-completion-03", lesson: 3, duration: "42:05" },
  { id: "sentence-completion-04", lesson: 4, duration: "35:44" },
  { id: "sentence-completion-05", lesson: 5, duration: "29:46" },
] as const;

const VERBAL_CONTEXTUAL_ERROR_VIDEOS = [
  { id: "contextual-error-01", lesson: 1, duration: "34:01" },
  { id: "contextual-error-02", lesson: 2, duration: "35:22" },
  { id: "contextual-error-03", lesson: 3, duration: "30:58" },
] as const;

const VERBAL_READING_COMPREHENSION_VIDEOS = [
  { id: "reading-comprehension-01", lesson: 1, duration: "55:36" },
  { id: "reading-comprehension-02", lesson: 2, duration: "50:08" },
  { id: "reading-comprehension-03", lesson: 3, duration: "46:26" },
  { id: "reading-comprehension-04", lesson: 4, duration: "49:59" },
  { id: "reading-comprehension-05", lesson: 5, duration: "41:05" },
  { id: "reading-comprehension-06", lesson: 6, duration: "43:15" },
  { id: "reading-comprehension-07", lesson: 7, duration: "42:44" },
  { id: "reading-comprehension-08", lesson: 8, duration: "42:57" },
  { id: "reading-comprehension-09", lesson: 9, duration: "65:10" },
] as const;

function EmptyContentNotice({ label }: { label: string }) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-border bg-card/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
      لا يوجد محتوى منشور لـ{label} حتى الآن.
    </div>
  );
}

function SectionItemCard({ item }: { item: ContentItem }) {
  const Icon = item.icon;
  const card = (
    <div className={`group h-full rounded-2xl border border-border bg-card p-4 transition ${item.href ? "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-muted/40 px-2.5 py-1 text-[10px] font-black text-muted-foreground">
          {item.tag || (item.href ? "فتح بنك القسم" : "قيد المراجعة")}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-black text-foreground">{item.title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
      {item.href && <p className="mt-3 text-[11px] font-black text-[#147D68] dark:text-emerald-400">افتح بنك الأسئلة للتدريب والاختبار</p>}
    </div>
  );

  return item.href ? <Link href={item.href}>{card}</Link> : card;
}

function ResourceCard({
  title,
  description,
  icon: Icon,
  href,
  accent,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  accent: string;
}) {
  return (
    <Link href={href} className="group block rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
        <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
      </div>
      <h3 className="mt-4 text-base font-black text-foreground">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </Link>
  );
}

function TestChoiceCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-foreground">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />
    </Link>
  );
}

function BankLessonCard({ lesson, index, subject }: { lesson: FoundationContent; index: number; subject: "quantitative" | "verbal" }) {
  const directVideo = isDirectFoundationVideo(lesson.videoUrl || "");
  const lessonHref = `/foundation?program=qudrat&subject=${lesson.subjectId?.split(".").pop() || "quantitative"}&lesson=${encodeURIComponent(lesson._id)}`;

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="relative aspect-video bg-[#07111f]">
        {directVideo ? (
          <video
            src={resolveFoundationAssetUrl(lesson.videoUrl)}
            title={lesson.title}
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload"
          />
        ) : lesson.videoUrl ? (
          <iframe
            src={lesson.videoUrl}
            title={lesson.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-bold text-slate-300">لا يوجد فيديو لهذا البنك</div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-[#0D1B2A]/85 px-3 py-1 text-[11px] font-black text-white">
          بنك {index + 1}
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div>
           <p className="text-xs font-black text-[#147D68] dark:text-emerald-400">فيديوهات تدريب المحوسب · بنك {subject === "quantitative" ? "الكمي" : "اللفظي"}</p>
          <h4 className="mt-1 text-base font-black text-foreground">{lesson.title}</h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{lesson.description}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {lesson.attachments?.length ? (
            lesson.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={resolveFoundationAssetUrl(attachment.url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-black text-[#A64242] dark:text-red-300 hover:bg-red-500/15"
              >
                <FileText className="h-4 w-4" />
                ملف البنك PDF
              </a>
            ))
          ) : (
            <span className="inline-flex items-center justify-center rounded-xl border border-dashed border-border px-3 py-2 text-xs font-bold text-muted-foreground">
              لا يوجد ملف لهذا البنك
            </span>
          )}
          {lesson.quiz?.questionIds?.length ? (
            <Link
              href={lessonHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] dark:bg-primary dark:text-primary-foreground px-3 py-2 text-xs font-black text-white hover:bg-[#18334D] dark:hover:bg-primary/90"
            >
              <ListChecksIcon />
              الاختبار ({lesson.quiz.questionIds.length} سؤال)
            </Link>
          ) : (
            <span className="inline-flex items-center justify-center rounded-xl border border-dashed border-border px-3 py-2 text-xs font-bold text-muted-foreground">
              لا يوجد اختبار مرتبط
            </span>
          )}
        </div>
        <Link href={lessonHref} className="block text-center text-xs font-black text-[#147D68] dark:text-emerald-400 hover:underline">
          فتح البنك في صفحة الدرس والاختبار
        </Link>
      </div>
    </article>
  );
}

function ListChecksIcon() {
  return <CheckCircle2 className="h-4 w-4" />;
}

type VerbalVideoCatalogEntry = {
  id: string;
  lesson: number;
  duration: string;
};

type VerbalVideoCategoryConfig = {
  label: string;
  section: string;
  routeSegment: string;
  testIdPrefix: string;
  videos: readonly VerbalVideoCatalogEntry[];
};

function VerbalVideoCategorySection({
  category,
  progressById,
  progressLoaded,
  onProgressEvent,
}: {
  category: VerbalVideoCategoryConfig;
  progressById: ReadonlyMap<string, QudratVerbalVideoProgress>;
  progressLoaded: boolean;
  onProgressEvent: (
    videoId: string,
    input: QudratVerbalVideoProgressInput,
  ) => Promise<QudratVerbalVideoProgress>;
}) {
  return (
    <div className="mt-6 border-t border-border pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#147D68] dark:text-emerald-400">{category.label} · المحوسب</p>
          <h4 className="mt-1 text-lg font-black text-foreground">دروس ملخص الـ95</h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            شاهد كل درس ثم ابدأ اختبارًا من ١٠ أسئلة في {category.label}.
          </p>
        </div>
        <span className="rounded-full bg-card px-3 py-1 text-xs font-black text-[#147D68] dark:text-emerald-400">
          {category.videos.length} دروس · {category.videos.length} اختبارات
        </span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {category.videos.map((video) => (
          <VerbalVideoProgressCard
            key={video.id}
            videoId={video.id}
            lesson={video.lesson}
            duration={video.duration}
            categoryLabel={category.label}
            videoUrl={`/api/learning/computerized/verbal/${category.routeSegment}/${video.id}`}
            quizUrl={`/verbal-lesson-quiz/verbal/${video.lesson}?section=${category.section}&count=10`}
            quizLabel={`اختبار ${category.label} بعد الدرس · ١٠ أسئلة`}
            testIdPrefix={category.testIdPrefix}
            progress={progressById.get(video.id)}
            progressLoaded={progressLoaded}
            onProgressEvent={onProgressEvent}
          />
        ))}
      </div>
    </div>
  );
}

function VerbalFilesSection() {
  const queryClient = useQueryClient();
  const progressQuery = useGetQudratVerbalVideoProgress({
    query: {
      queryKey: getGetQudratVerbalVideoProgressQueryKey(),
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  });
  const progressMutation = useRecordQudratVerbalVideoProgress({
    mutation: {
      onSuccess: (progress) => {
        queryClient.setQueryData<QudratVerbalVideoProgressSummary>(
          getGetQudratVerbalVideoProgressQueryKey(),
          (current) => current
            ? {
                ...current,
                items: current.items.map((item) =>
                  item.videoId === progress.videoId ? progress : item,
                ),
              }
            : current,
        );
      },
    },
  });
  const progressQueueRef = useRef(new Map<string, Promise<QudratVerbalVideoProgress>>());
  const onProgressEvent = useCallback(
    (videoId: string, input: QudratVerbalVideoProgressInput) => {
      const previous = progressQueueRef.current.get(videoId);
      const request = previous
        ? previous.catch(() => undefined).then(() => progressMutation.mutateAsync({ videoId, data: input }))
        : progressMutation.mutateAsync({ videoId, data: input });
      progressQueueRef.current.set(videoId, request);
      void request.finally(() => {
        if (progressQueueRef.current.get(videoId) === request) {
          progressQueueRef.current.delete(videoId);
        }
      }).catch(() => undefined);
      return request;
    },
    [progressMutation.mutateAsync],
  );
  const progressById = new Map(
    (progressQuery.data?.items || []).map((item) => [item.videoId, item] as const),
  );
  const completedVideoCount = progressQuery.data?.items.filter((item) => item.state === "COMPLETED").length || 0;
  const completionPercent = progressQuery.data?.items.length
    ? Math.round((completedVideoCount / progressQuery.data.items.length) * 100)
    : 0;
  const progressLoaded = progressQuery.isSuccess || progressQuery.isError;
  const categories: VerbalVideoCategoryConfig[] = [
    {
      label: "استيعاب المقروء",
      section: "reading-comprehension",
      routeSegment: "reading-comprehension-videos",
      testIdPrefix: "verbal-reading-comprehension",
      videos: VERBAL_READING_COMPREHENSION_VIDEOS,
    },
    {
      label: "الخطأ السياقي",
      section: "contextual-error",
      routeSegment: "contextual-error-videos",
      testIdPrefix: "verbal-contextual-error",
      videos: VERBAL_CONTEXTUAL_ERROR_VIDEOS,
    },
    {
      label: "إكمال الجمل",
      section: "sentence-completion",
      routeSegment: "sentence-completion-videos",
      testIdPrefix: "verbal-sentence-completion",
      videos: VERBAL_SENTENCE_COMPLETION_VIDEOS,
    },
    {
      label: "التناظر اللفظي",
      section: "analogy",
      routeSegment: "analogy-videos",
      testIdPrefix: "verbal-analogy",
      videos: VERBAL_ANALOGY_VIDEOS,
    },
  ];

  return (
    <section
      className="rounded-3xl border border-border bg-muted/40 p-5 md:p-6"
      aria-labelledby="verbal-computerized-files-title"
      data-testid="section-verbal-computerized-files"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#3B67A5] dark:text-sky-400">مراجعة الأقسام</p>
          <h3
            id="verbal-computerized-files-title"
            className="mt-1 text-xl font-black text-foreground"
          >
            ملفات ودروس اللفظي
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            ملفات PDF للأقسام، ودروس الاستيعاب المقروء وإكمال الجمل والخطأ السياقي والتناظر اللفظي في المحوسب مع اختبار بعد كل درس.
          </p>
        </div>
        <span className="rounded-full bg-card px-3 py-1 text-xs font-black text-[#3B67A5] dark:text-sky-400">
          ٤ ملفات · ٢٣ درسًا واختبارًا
        </span>
      </div>
      <div className="mt-4 rounded-2xl border border-border bg-card p-4" data-testid="verbal-video-progress-summary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black text-foreground">تقدم مشاهدة دروس اللفظي</p>
          {progressQuery.data ? (
            <p className="text-xs font-bold text-[#147D68] dark:text-emerald-400">
              {completedVideoCount} من {progressQuery.data.items.length} فيديو مكتمل المشاهدة
            </p>
          ) : (
            <p className="text-xs font-bold text-muted-foreground">
              {progressQuery.isError ? "تعذر تحميل التقدم المحفوظ" : "جارٍ تحميل تقدم المشاهدة…"}
            </p>
          )}
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="عدد فيديوهات اللفظي المكتملة"
          aria-valuemin={0}
          aria-valuemax={progressQuery.data?.items.length || 23}
          aria-valuenow={completedVideoCount}
        >
          <div
            className="h-full rounded-full bg-[#147D68] transition-[width]"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
          يُستأنف الفيديو من آخر موضع محفوظ، ويُسجّل مكتملًا بعد مشاهدة ٩٠٪ من محتواه. نتيجة الاختبار منفصلة عن تقدم المشاهدة.
        </p>
        {progressQuery.isError ? (
          <button
            type="button"
            className="mt-2 text-xs font-black text-[#3B67A5] dark:text-sky-400 hover:underline"
            onClick={() => void progressQuery.refetch()}
          >
            إعادة تحميل التقدم
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {VERBAL_COMPUTERIZED_FILES.map((file) => (
          <a
            key={file.id}
            href={`/api/learning/foundation-book/verbal/files/${file.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-20 items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-[#3B67A5]/40 hover:shadow-sm"
            data-testid={`link-verbal-book-file-${file.id}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-[#3B67A5] dark:text-sky-400">
                <FileText className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-foreground">
                  ملخص الـ95
                </span>
                <span className="mt-1 block text-xs font-bold text-muted-foreground">
                  {file.section} · PDF
                </span>
              </span>
            </div>
            <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />
          </a>
        ))}
      </div>
      {categories.map((category) => (
        <VerbalVideoCategorySection
          key={category.section}
          category={category}
          progressById={progressById}
          progressLoaded={progressLoaded}
          onProgressEvent={onProgressEvent}
        />
      ))}
    </section>
  );
}

function SubjectWorkspace({ mode }: { mode: "quantitative" | "verbal" }) {
  const isQuantitative = mode === "quantitative";
  const title = isQuantitative ? "مسار الكمي" : "مسار اللفظي";
  const description = isQuantitative
    ? "مساحة منظمة لبنوك الكمي، فيديوهات الشرح، اختبارات الأقسام، والتقفيلات."
    : "مساحة منظمة لبنوك اللفظي، فيديوهات الشرح، اختبارات الأقسام، والتقفيلات.";
  const items = isQuantitative ? QUANTITATIVE_ITEMS : VERBAL_ITEMS;
  const subject = isQuantitative ? "quantitative" : "verbal";
  const { data: lessons = [], isLoading: isLessonsLoading } = useFoundationContent(
    "qudrat",
    true,
    `subject.qudrat.${subject}`,
  );
  const bankLessons = isQuantitative
    ? lessons.filter((lesson) => /^بنك الكمي المحوسب \d+$/.test(lesson.title))
    : lessons;

  return (
    <section className="space-y-5" aria-labelledby={`${subject}-workspace-title`}>
      <div className="rounded-[1.5rem] border border-border bg-muted/40 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black text-[#147D68] dark:text-emerald-400">المحوسب · {isQuantitative ? "الكمي" : "اللفظي"}</p>
            <h2 id={`${subject}-workspace-title`} className="mt-1 text-2xl font-black text-foreground">{title}</h2>
             <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-right">
            <p className="text-[11px] font-bold text-muted-foreground">حالة المحتوى</p>
             <p className="mt-1 text-sm font-black text-[#147D68] dark:text-emerald-400">
               {isLessonsLoading
                 ? "جارٍ التحقق من المحتوى"
                 : bankLessons.length
                   ? `${bankLessons.length} بنكًا منشورًا`
                   : isQuantitative
                     ? "لا توجد بنوك منشورة"
                     : "ملفات وفيديوهات منشورة"}
             </p>
          </div>
        </div>
      </div>

      {!isQuantitative && <VerbalFilesSection />}

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-foreground">المصادر الرئيسية</h3>
            <p className="mt-1 text-xs text-muted-foreground">كل مصدر له مكان واضح حتى تتم إضافة المحتوى بدون إعادة بناء الواجهة.</p>
          </div>
           <span className="hidden rounded-full bg-muted px-3 py-1 text-[11px] font-black text-muted-foreground sm:inline-flex">٤ اختيارات</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
           <ResourceCard
             title={`بنك أسئلة ${isQuantitative ? "الكمي" : "اللفظي"}`}
             description="أسئلة مرتبة حسب القسم والمستوى والمصدر."
             icon={Library}
             href="/question-bank"
             accent={isQuantitative ? "bg-emerald-500/10 text-[#147D68] dark:text-emerald-400" : "bg-sky-500/10 text-[#3B67A5] dark:text-sky-400"}
           />
           <TestChoiceCard
             title={`اختبارات ${isQuantitative ? "الكمي" : "اللفظي"}`}
             description="اختبارات الأقسام والتدريب المحوسب."
             icon={Flag}
             href={isQuantitative ? "/quantitative-tests" : "/verbal-tests"}
           />
           <TestChoiceCard
             title="اختبار مخصص"
             description={`اختر عدد أسئلة ${isQuantitative ? "الكمي" : "اللفظي"} بنفسك.`}
             icon={Target}
             href="/custom-exam"
           />
           <TestChoiceCard
             title={isQuantitative ? "اختبار كمي شامل · ٥٥ سؤالًا" : "اختبار لفظي شامل · ٦٥ سؤالًا"}
             description="اختبار كامل داخل إطار الاختبار الأساسي."
             icon={Trophy}
             href={isQuantitative ? "/qiyas?examId=3" : "/qiyas?examId=2"}
           />
        </div>
      </div>

       <section className="rounded-3xl border border-border bg-muted/40 p-5 md:p-6" aria-labelledby={`${subject}-banks-title`}>
         <div className="flex flex-wrap items-end justify-between gap-3">
           <div>
             <p className="text-xs font-black text-[#147D68] dark:text-emerald-400">المحتوى المرتبط</p>
             <h3 id={`${subject}-banks-title`} className="mt-1 text-xl font-black text-foreground">
               {isQuantitative ? "بنوك الكمي" : "بنوك اللفظي"}
             </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
               {isQuantitative
                  ? "هذه فيديوهات تدريب المحوسب، وليست دروس التأسيس. شاهد الفيديو ثم افتح ملف البنك واختباره من نفس البطاقة."
                  : "دروس اللفظي المحوسب وملفاتها متاحة في القسم أعلاه؛ بنوك الأسئلة المنفصلة تظهر هنا عند نشرها."}
             </p>
           </div>
           <span className="rounded-full bg-card px-3 py-1 text-xs font-black text-[#147D68] dark:text-emerald-400">
              {isLessonsLoading ? "جاري التحميل" : `${bankLessons.length} بنك`}
           </span>
         </div>
          {bankLessons.length ? (
           <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {bankLessons.map((lesson, index) => <BankLessonCard key={lesson._id} lesson={lesson} index={index} subject={subject} />)}
           </div>
         ) : !isLessonsLoading ? (
           isQuantitative ? (
             <EmptyContentNotice label="بنوك الكمي" />
           ) : (
             <div className="mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 text-sm leading-6 text-foreground" data-testid="status-verbal-banks-published-content">
               لا توجد بنوك أسئلة منفصلة منشورة في هذه القائمة. ملفات PDF والفيديوهات الـ٢٣ متاحة في قسم «ملفات ودروس اللفظي» أعلاه، ويبدأ اختبار الدرس فقط إذا توفرت له ١٠ أسئلة منشورة من القسم نفسه.
               <a href="#verbal-computerized-files-title" className="mr-2 font-black text-primary underline underline-offset-4" data-testid="link-verbal-files-section">
                 انتقل إلى الملفات والدروس
               </a>
             </div>
           )
         ) : null}
       </section>

      <div>
        <div className="mb-3">
          <h3 className="text-lg font-black text-foreground">أقسام {isQuantitative ? "الكمي" : "اللفظي"}</h3>
          <p className="mt-1 text-xs text-muted-foreground">اختر القسم للوصول إلى بنك أسئلته واختباره، ثم استخدم الاختبار الشامل عند الانتهاء.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <SectionItemCard
              key={item.title}
              item={{
                ...item,
                href: item.href || `/question-bank?category=${subject}&subcategory=${encodeURIComponent(item.title)}`,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const EXAM_ENTRIES: Array<{ title: string; description: string; href: string; icon: LucideIcon; tag: string }> = [
  { title: "اختبار المحاكاة", description: "محاكاة اختبار القدرات بنفس الإطار والتوقيت.", href: "/qiyas", icon: Trophy, tag: "محاكاة" },
  { title: "النماذج الورقية", description: "نماذج ورقية قابلة للطباعة والتصحيح.", href: "/paper-models", icon: FileText, tag: "ورقي" },
  { title: "حجز اختبار مجدول", description: "احجز موعدًا لاختبار محدد الوقت.", href: "/book-exam", icon: Clock3, tag: "مجدول" },
  { title: "اختبار المحاكاة القياسي", description: "اختبار قدرات مقسّم إلى أقسام مع توقيت لكل قسم.", href: "/standard-test", icon: Target, tag: "قياسي" },
  { title: "الاختبار التكيفي", description: "تدرّب على أسئلة تتكيف مع أدائك أثناء المحاولة.", href: "/adaptive-test", icon: Layers3, tag: "تكيفي" },
  { title: "اختبار الكمي المجاني", description: "اختبار كمي ضمن فرصة التدريب اليومية المتاحة لحسابك.", href: "/free-quantitative-test", icon: Calculator, tag: "يومي" },
  { title: "اختبار اللفظي المجاني", description: "اختبار لفظي ضمن فرصة التدريب اليومية المتاحة لحسابك.", href: "/free-verbal-test", icon: BookOpen, tag: "يومي" },
  { title: "اختبار مخصص ومختلط", description: "حدد توزيع الكمي واللفظي وعدد الأسئلة بنفسك.", href: "/custom-exam", icon: Layers3, tag: "مخصص" },
  { title: "اختبارات الكمي", description: "اختبارات أقسام الكمي والتدريب المحوسب.", href: "/quantitative-tests", icon: Calculator, tag: "كمي" },
  { title: "اختبارات اللفظي", description: "اختبارات أقسام اللفظي والتدريب المحوسب.", href: "/verbal-tests", icon: BookOpen, tag: "لفظي" },
];

function ExamsWorkspace() {
  return (
    <section className="rounded-[1.5rem] border border-border bg-muted/40 p-5 md:p-6" aria-labelledby="computerized-exams-title" data-testid="section-computerized-exams">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black text-[#9A6A1F] dark:text-amber-400">المحوسب · الاختبارات</p>
          <h2 id="computerized-exams-title" className="mt-1 text-2xl font-black text-foreground">كل اختبارات القدرات في مكان واحد</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">اختر نوع الاختبار: محاكاة، نماذج ورقية، موعد مجدول، مخصص، أو اختبارات القسم.</p>
        </div>
        <Link href="/records" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-black text-foreground transition hover:border-primary/40">
          نتائجي السابقة
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EXAM_ENTRIES.map((entry, i) => {
          const Icon = entry.icon;
          return (
            <Link key={entry.href} href={entry.href} data-testid={`link-exam-${entry.href.slice(1)}`} className="group flex flex-col rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black text-muted-foreground">{String(i + 1).padStart(2, "0")} · {entry.tag}</span>
              </div>
              <h3 className="mt-4 text-base font-black text-foreground">{entry.title}</h3>
              <p className="mt-1 flex-1 text-xs leading-5 text-muted-foreground">{entry.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[#147D68] dark:text-emerald-400">ابدأ<ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /></span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SearchWorkspace() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  };

  return (
    <section className="rounded-[1.5rem] border border-[#E4D8E9] bg-[#FCF9FD] p-5 md:p-6">
      <div>
        <p className="text-xs font-black text-[#7A4B91] dark:text-fuchsia-400">المحوسب · سؤال مباشر</p>
        <h2 className="mt-1 text-2xl font-black text-foreground">ابحث عن سؤال فقط</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          اكتب كلمة أو رقم السؤال للوصول إليه بعد إضافة بنك الأسئلة الجديد وتصنيفه.
        </p>
      </div>
      <form onSubmit={submitSearch} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="computerized-question-search" className="sr-only">ابحث في بنك الأسئلة</label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="computerized-question-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="مثال: سؤال الهندسة أو رقم السؤال"
            className="h-12 w-full rounded-xl border border-[#DCCDE3] bg-card pr-10 pl-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[#7A4B91] focus:ring-2 focus:ring-[#7A4B91]/15"
          />
        </div>
        <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#7A4B91] px-5 text-sm font-black text-white transition hover:bg-[#633D77]">
          بحث
          <Search className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-4 rounded-xl border border-dashed border-[#DCCDE3] bg-card/70 px-3 py-3 text-xs leading-5 text-muted-foreground">
        {submittedQuery
          ? `لا توجد نتائج حالية لعبارة «${submittedQuery}». ستظهر النتائج بعد إضافة الداتا الجديدة ومراجعتها.`
          : "نتائج البحث ستظهر هنا بعد إضافة الداتا الجديدة ومراجعتها."}
      </div>
      <div className="mt-4 flex flex-col gap-4 border-t border-[#E4D8E9] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-foreground">البحث المتقدم</p>
          <p className="mt-1 text-xs text-muted-foreground">يمكن ربط الفلاتر بالقسم والمصدر والمستوى عند وصول الداتا.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500/10 px-3 py-2 text-[11px] font-black text-[#7A4B91] dark:text-fuchsia-400">
          <Sparkles className="h-3.5 w-3.5" />
          جاهز للتصنيف
        </span>
      </div>
    </section>
  );
}

export default function ComputerizedPage() {
  const [activeTrack, setActiveTrack] = useState<ComputerizedTrack>("qudrat");
  const [activeMode, setActiveMode] = useState<ComputerizedMode>("quantitative");
  const { data: dashboard } = useStudentDashboard();
  const { data: foundationContent = [], isLoading: foundationLoading, isError: foundationError } =
    useFoundationContent("qudrat", activeTrack === "qudrat");
  const {
    data: foundationSummary,
    isLoading: foundationSummaryLoading,
    isError: foundationSummaryError,
  } = useLearningContentProgressSummary("qudrat", undefined, activeTrack === "qudrat");
  const { data: foundationLearningState, isLoading: foundationStateLoading } =
    useFoundationLearningState("qudrat", activeTrack === "qudrat");
  const foundationLessons = foundationContent.filter((item) => Boolean(item.videoUrl || item.quiz));
  const completedFoundationIds = new Set(foundationSummary?.completedContentIds || []);
  const workflowStatuses = resolveStudentWorkflowStatuses({
    foundationAvailableCount: foundationLessons.length,
    foundationCompletedCount: foundationLessons.filter((item) => completedFoundationIds.has(item._id)).length,
    foundationEvidenceLoaded: !foundationLoading && !foundationSummaryLoading && !foundationError && !foundationSummaryError,
    diagnosticComplete: foundationLearningState?.status === "diagnostic_completed",
    testTypeEvidence: dashboard?.testTypeEvidence || [],
  });
  const completed = dashboard?.stats.totalTests ?? 0;
  const average = dashboard?.stats.averageScore ?? 0;

  return (
    <div className="min-h-full bg-background" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-24 lg:px-8">
        <header className="overflow-hidden rounded-[1.75rem] bg-[#0D1B2A] p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-black text-[#F7F775]">قدرات · مركز التدريب</p>
              <h1 className="text-3xl font-black md:text-4xl">المحوسب</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#CBD5E1]">
                تدرّب على اللفظي أو الكمي بتركيز، وافتح مسار التحصيلي من صفحته المخصصة.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-2xl font-black">{completed}</p>
                <p className="text-[11px] font-bold text-white/60">اختبار مكتمل</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-2xl font-black">{average}%</p>
                <p className="text-[11px] font-bold text-white/60">متوسط الأداء</p>
              </div>
            </div>
          </div>
        </header>

        <section aria-labelledby="computerized-track-title">
          <div className="mb-3">
            <h2 id="computerized-track-title" className="text-xl font-black text-foreground">اختر المسار</h2>
            <p className="mt-1 text-sm text-muted-foreground">هذه هي الخطوة الأولى قبل اختيار نوع التدريب.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {TRACKS.map((track) => {
              const Icon = track.icon;
              const selected = activeTrack === track.key;
              if (track.key === "tahsili") {
                return (
                  <Link key={track.key} href="/student-program/tahsili" data-testid="link-tahsili-program" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-right transition hover:border-primary/50 hover:shadow-sm md:p-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground"><Icon className="h-6 w-6" /></span>
                    <span>
                      <span className="block text-lg font-black text-foreground">التحصيلي</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">افتح التأسيس والدراسة والاختبارات المنشورة.</span>
                    </span>
                  </Link>
                );
              }
              return (
                <button
                  key={track.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setActiveTrack(track.key);
                    setActiveMode("quantitative");
                  }}
                  className={`flex items-center gap-4 rounded-2xl border p-4 text-right transition-all md:p-5 ${
                    selected
                      ? "border-[#0D1B2A] bg-[#0D1B2A] dark:bg-primary dark:text-primary-foreground text-white shadow-md"
                      : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                  }`}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-white/10 text-[#F7F775] dark:bg-black/5 dark:text-primary-foreground" : track.key === "qudrat" ? "bg-emerald-500/10 text-[#147D68] dark:text-emerald-400" : "bg-[#FFF0F2] text-[#C94C65]"}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-lg font-black">{track.title}</span>
                    <span className={`mt-1 block text-xs leading-5 ${selected ? "text-white/65 dark:text-primary-foreground/80" : "text-muted-foreground"}`}>{track.description}</span>
                  </span>
                  {selected && <CheckCircle2 className="mr-auto h-5 w-5 text-[#F7F775]" />}
                </button>
              );
            })}
          </div>
        </section>

        {activeTrack === "qudrat" && !foundationStateLoading && (
          <StudentWorkflow
            statuses={workflowStatuses}
            focusLabel={dashboard?.recommendedPlan.focusSubject === "verbal" ? "اللفظي" : dashboard?.recommendedPlan.focusSubject === "quantitative" ? "الكمي" : undefined}
            nextAction={{ label: "افتح مهمة التدريب", href: "/computerized" }}
          />
        )}

        {activeTrack === "qudrat" && (
          <>
        <section aria-labelledby="computerized-options-title">
          <div className="mb-3">
            <h2 id="computerized-options-title" className="text-xl font-black text-foreground">اختر مسار التدريب</h2>
            <p className="mt-1 text-sm text-muted-foreground">ابدأ من النوع الذي تريد مراجعته الآن.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const selected = activeMode === mode.key;
              return (
                <button
                  key={mode.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveMode(mode.key)}
                  className={`rounded-2xl border p-4 text-right transition-all ${
                    selected
                      ? "border-[#0D1B2A] bg-[#0D1B2A] dark:bg-primary dark:text-primary-foreground text-white shadow-md"
                      : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
                  }`}
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${selected ? "bg-white/10 text-[#F7F775] dark:bg-black/5 dark:text-primary-foreground" : `${mode.iconSurface} ${mode.accent}`}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-base font-black">{mode.title}</p>
                  <p className={`mt-1 text-xs leading-5 ${selected ? "text-white/65 dark:text-primary-foreground/80" : "text-muted-foreground"}`}>{mode.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {activeMode === "quantitative" && <SubjectWorkspace mode="quantitative" />}
        {activeMode === "verbal" && <SubjectWorkspace mode="verbal" />}
        {activeMode === "exams" && <ExamsWorkspace />}
        {activeMode === "search" && <SearchWorkspace />}
          </>
        )}
      </div>
    </div>
  );
}