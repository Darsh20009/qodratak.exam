import { useState, type FormEvent } from "react";
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
import { useFoundationContent, useStudentDashboard, type FoundationContent } from "@/hooks/use-student";
import { StudentWorkflow } from "@/components/student/StudentWorkflow";
import { isDirectFoundationVideo, resolveFoundationAssetUrl } from "@/lib/foundationVideoUrl";

type ComputerizedMode = "quantitative" | "verbal" | "mixed" | "search";
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
    accent: "text-[#147D68]",
    iconSurface: "bg-[#EAF8F3]",
  },
  {
    key: "verbal",
    title: "اللفظي",
    description: "تدرّب على أقسام اللفظي من الشرح إلى الاختبار.",
    icon: BookOpen,
    accent: "text-[#3B67A5]",
    iconSurface: "bg-[#EEF4FF]",
  },
  {
    key: "mixed",
    title: "الاختبارات المختلطة",
    description: "محاكاة تجمع الكمي واللفظي في اختبار واحد.",
    icon: Layers3,
    accent: "text-[#9A6A1F]",
    iconSurface: "bg-[#FFF7E6]",
  },
  {
    key: "search",
    title: "ابحث عن سؤال فقط",
    description: "انتقل مباشرة إلى السؤال الذي تريد مراجعته.",
    icon: Search,
    accent: "text-[#7A4B91]",
    iconSurface: "bg-[#F7EEFB]",
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
    description: "الكمي واللفظي والاختبارات المختلطة.",
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

function EmptyContentNotice({ label }: { label: string }) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-[#CBD5E1] bg-white/70 px-3 py-2 text-xs leading-5 text-[#64748B]">
      لا يوجد محتوى منشور لـ{label} حتى الآن.
    </div>
  );
}

function SectionItemCard({ item }: { item: ContentItem }) {
  const Icon = item.icon;
  const card = (
    <div className={`group h-full rounded-2xl border border-[#E2E8F0] bg-white p-4 transition ${item.href ? "hover:-translate-y-0.5 hover:border-[#0D1B2A]/30 hover:shadow-md" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#0D1B2A]">
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-black text-[#64748B]">
          {item.tag || (item.href ? "فتح بنك القسم" : "قيد المراجعة")}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-black text-[#0D1B2A]">{item.title}</h3>
      <p className="mt-1 text-xs leading-5 text-[#64748B]">{item.description}</p>
      {item.href && <p className="mt-3 text-[11px] font-black text-[#147D68]">افتح بنك الأسئلة للتدريب والاختبار</p>}
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
    <Link href={href} className="group block rounded-2xl border border-[#E2E8F0] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#0D1B2A]/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
        <ArrowLeft className="h-4 w-4 text-[#94A3B8] transition-transform group-hover:-translate-x-1" />
      </div>
      <h3 className="mt-4 text-base font-black text-[#0D1B2A]">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-[#64748B]">{description}</p>
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
      className="group flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#0D1B2A]/30 hover:shadow-md"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#0D1B2A]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-[#0D1B2A]">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-[#64748B]">{description}</span>
      </span>
      <ArrowLeft className="h-4 w-4 shrink-0 text-[#94A3B8] transition-transform group-hover:-translate-x-1" />
    </Link>
  );
}

function BankLessonCard({ lesson, index, subject }: { lesson: FoundationContent; index: number; subject: "quantitative" | "verbal" }) {
  const directVideo = isDirectFoundationVideo(lesson.videoUrl || "");
  const lessonHref = `/foundation?program=qudrat&subject=${lesson.subjectId?.split(".").pop() || "quantitative"}&lesson=${encodeURIComponent(lesson._id)}`;

  return (
    <article className="overflow-hidden rounded-3xl border border-[#DDE6E2] bg-white shadow-sm">
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
           <p className="text-xs font-black text-[#147D68]">فيديوهات تدريب المحوسب · بنك {subject === "quantitative" ? "الكمي" : "اللفظي"}</p>
          <h4 className="mt-1 text-base font-black text-[#0D1B2A]">{lesson.title}</h4>
          <p className="mt-1 text-xs leading-5 text-[#64748B]">{lesson.description}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {lesson.attachments?.length ? (
            lesson.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={resolveFoundationAssetUrl(attachment.url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F0C7C7] bg-[#FFF7F7] px-3 py-2 text-xs font-black text-[#A64242] hover:bg-[#FDECEC]"
              >
                <FileText className="h-4 w-4" />
                ملف البنك PDF
              </a>
            ))
          ) : (
            <span className="inline-flex items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] px-3 py-2 text-xs font-bold text-[#64748B]">
              لا يوجد ملف لهذا البنك
            </span>
          )}
          {lesson.quiz?.questionIds?.length ? (
            <Link
              href={lessonHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] px-3 py-2 text-xs font-black text-white hover:bg-[#18334D]"
            >
              <ListChecksIcon />
              الاختبار ({lesson.quiz.questionIds.length} سؤال)
            </Link>
          ) : (
            <span className="inline-flex items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] px-3 py-2 text-xs font-bold text-[#64748B]">
              لا يوجد اختبار مرتبط
            </span>
          )}
        </div>
        <Link href={lessonHref} className="block text-center text-xs font-black text-[#147D68] hover:underline">
          فتح البنك في صفحة الدرس والاختبار
        </Link>
      </div>
    </article>
  );
}

function ListChecksIcon() {
  return <CheckCircle2 className="h-4 w-4" />;
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
      <div className="rounded-[1.5rem] border border-[#DDE6E2] bg-[#F8FBFA] p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black text-[#147D68]">المحوسب · {isQuantitative ? "الكمي" : "اللفظي"}</p>
            <h2 id={`${subject}-workspace-title`} className="mt-1 text-2xl font-black text-[#0D1B2A]">{title}</h2>
             <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">{description}</p>
          </div>
          <div className="rounded-xl border border-[#DDE6E2] bg-white px-4 py-3 text-right">
            <p className="text-[11px] font-bold text-[#64748B]">حالة المحتوى</p>
             <p className="mt-1 text-sm font-black text-[#147D68]">{bankLessons.length ? `${bankLessons.length} بنكًا منشورًا` : "لا توجد بنوك منشورة"}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#0D1B2A]">المصادر الرئيسية</h3>
            <p className="mt-1 text-xs text-[#64748B]">كل مصدر له مكان واضح حتى تتم إضافة المحتوى بدون إعادة بناء الواجهة.</p>
          </div>
           <span className="hidden rounded-full bg-[#F1F5F9] px-3 py-1 text-[11px] font-black text-[#64748B] sm:inline-flex">٤ اختيارات</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
           <ResourceCard
             title={`بنك أسئلة ${isQuantitative ? "الكمي" : "اللفظي"}`}
             description="أسئلة مرتبة حسب القسم والمستوى والمصدر."
             icon={Library}
             href="/question-bank"
             accent={isQuantitative ? "bg-[#EAF8F3] text-[#147D68]" : "bg-[#EEF4FF] text-[#3B67A5]"}
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

       <section className="rounded-3xl border border-[#DDE6E2] bg-[#F8FBFA] p-5 md:p-6" aria-labelledby={`${subject}-banks-title`}>
         <div className="flex flex-wrap items-end justify-between gap-3">
           <div>
             <p className="text-xs font-black text-[#147D68]">المحتوى المرتبط</p>
             <h3 id={`${subject}-banks-title`} className="mt-1 text-xl font-black text-[#0D1B2A]">
               {isQuantitative ? "بنوك الكمي" : "بنوك اللفظي"}
             </h3>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">
               {isQuantitative
                  ? "هذه فيديوهات تدريب المحوسب، وليست دروس التأسيس. شاهد الفيديو ثم افتح ملف البنك واختباره من نفس البطاقة."
                  : "فيديوهات اللفظي المحوسب منفصلة في هذه المرحلة عن فيديوهات التأسيس، ولكل بنك ملف واختبار مرتبطان به."}
             </p>
           </div>
           <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#147D68]">
              {isLessonsLoading ? "جاري التحميل" : `${bankLessons.length} بنك`}
           </span>
         </div>
          {bankLessons.length ? (
           <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {bankLessons.map((lesson, index) => <BankLessonCard key={lesson._id} lesson={lesson} index={index} subject={subject} />)}
           </div>
         ) : !isLessonsLoading ? (
           <EmptyContentNotice label={`بنوك ${isQuantitative ? "الكمي" : "اللفظي"}`} />
         ) : null}
       </section>

      <div>
        <div className="mb-3">
          <h3 className="text-lg font-black text-[#0D1B2A]">أقسام {isQuantitative ? "الكمي" : "اللفظي"}</h3>
          <p className="mt-1 text-xs text-[#64748B]">اختر القسم للوصول إلى بنك أسئلته واختباره، ثم استخدم الاختبار الشامل عند الانتهاء.</p>
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

function MixedWorkspace() {
  return (
    <section className="rounded-[1.5rem] border border-[#E8DFC9] bg-[#FFFCF5] p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black text-[#9A6A1F]">المحوسب · اختبارات مختلطة</p>
          <h2 className="mt-1 text-2xl font-black text-[#0D1B2A]">اختبر الكمي واللفظي معًا</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
            هنا ستظهر الاختبارات المحاكية والتقفيلات المختلطة التي تجمع القسمين في تجربة واحدة.
          </p>
        </div>
        <Link href="/qiyas" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] px-4 py-3 text-sm font-black text-white transition hover:bg-[#18334D]">
          فتح الاختبارات المختلطة
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <TestChoiceCard title="اختبار مختلط شامل" description="اختبار قدرات يجمع الكمي واللفظي." href="/qiyas?examId=1" icon={Layers3} />
        <TestChoiceCard title="اختبار محاكاة كامل" description="تجربة اختبار داخل إطار الاختبار الأساسي." href="/qiyas?examId=5" icon={Trophy} />
        <TestChoiceCard title="اختبار مختلط مخصص" description="حدد توزيع وعدد الأسئلة بنفسك." href="/custom-exam" icon={Target} />
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
        <p className="text-xs font-black text-[#7A4B91]">المحوسب · سؤال مباشر</p>
        <h2 className="mt-1 text-2xl font-black text-[#0D1B2A]">ابحث عن سؤال فقط</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
          اكتب كلمة أو رقم السؤال للوصول إليه بعد إضافة بنك الأسئلة الجديد وتصنيفه.
        </p>
      </div>
      <form onSubmit={submitSearch} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="computerized-question-search" className="sr-only">ابحث في بنك الأسئلة</label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            id="computerized-question-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="مثال: سؤال الهندسة أو رقم السؤال"
            className="h-12 w-full rounded-xl border border-[#DCCDE3] bg-white pr-10 pl-4 text-sm text-[#0D1B2A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#7A4B91] focus:ring-2 focus:ring-[#7A4B91]/15"
          />
        </div>
        <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#7A4B91] px-5 text-sm font-black text-white transition hover:bg-[#633D77]">
          بحث
          <Search className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-4 rounded-xl border border-dashed border-[#DCCDE3] bg-white/70 px-3 py-3 text-xs leading-5 text-[#64748B]">
        {submittedQuery
          ? `لا توجد نتائج حالية لعبارة «${submittedQuery}». ستظهر النتائج بعد إضافة الداتا الجديدة ومراجعتها.`
          : "نتائج البحث ستظهر هنا بعد إضافة الداتا الجديدة ومراجعتها."}
      </div>
      <div className="mt-4 flex flex-col gap-4 border-t border-[#E4D8E9] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-[#0D1B2A]">البحث المتقدم</p>
          <p className="mt-1 text-xs text-[#64748B]">يمكن ربط الفلاتر بالقسم والمصدر والمستوى عند وصول الداتا.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#F7EEFB] px-3 py-2 text-[11px] font-black text-[#7A4B91]">
          <Sparkles className="h-3.5 w-3.5" />
          جاهز للتصنيف
        </span>
      </div>
    </section>
  );
}

function TahsiliWorkspace() {
  return (
    <section className="space-y-5" aria-labelledby="tahsili-workspace-title">
      <div className="rounded-[1.5rem] border border-[#F0DCE1] bg-[#FFF9FA] p-5 md:p-6">
        <p className="text-xs font-black text-[#C94C65]">المحوسب · التحصيلي</p>
        <h2 id="tahsili-workspace-title" className="mt-1 text-2xl font-black text-[#0D1B2A]">مسار التحصيلي</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
          اختر المادة أو انتقل إلى بنك الأسئلة والاختبارات الشاملة. سيُضاف محتوى كل مادة هنا عند وصول الداتا الجديدة.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResourceCard
          title="المواد العلمية"
          description="رياضيات وفيزياء وكيمياء وأحياء."
          icon={BookOpen}
          href="/tahsili"
          accent="bg-[#FFF0F2] text-[#C94C65]"
        />
        <ResourceCard
          title="بنك التحصيلي"
          description="أسئلة مرتبة حسب المادة والمستوى."
          icon={Library}
          href="/tahsilik/question-bank"
          accent="bg-[#F2F7FF] text-[#3B67A5]"
        />
        <ResourceCard
          title="الاختبارات الشاملة"
          description="اختبارات محاكية لجميع مواد التحصيلي."
          icon={Trophy}
          href="/tahsilik/tests"
          accent="bg-[#FFF7E6] text-[#9A6A1F]"
        />
        <ResourceCard
          title="نتائجي وتقدمي"
          description="راجع محاولاتك وما يحتاج إلى مراجعة."
          icon={CheckCircle2}
          href="/records"
          accent="bg-[#F7EEFB] text-[#7A4B91]"
        />
      </div>
    </section>
  );
}

export default function ComputerizedPage({
  initialTrack = "qudrat",
}: {
  initialTrack?: ComputerizedTrack;
}) {
  const [activeTrack, setActiveTrack] = useState<ComputerizedTrack>(initialTrack);
  const [activeMode, setActiveMode] = useState<ComputerizedMode>("quantitative");
  const { data: dashboard } = useStudentDashboard();
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
                اختر أولًا بين القدرات والتحصيلي، ثم انتقل إلى نوع التدريب الذي يناسبك.
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

        <StudentWorkflow
          currentStage="skills"
          level={dashboard?.recommendedPlan.level || "foundation"}
          progress={activeTrack === "tahsili" ? dashboard?.progress.tahsili.percentage || 0 : dashboard?.progress.qudrat.percentage || 0}
          focusLabel={dashboard?.recommendedPlan.focusSubject === "verbal" ? "اللفظي" : dashboard?.recommendedPlan.focusSubject === "quantitative" ? "الكمي" : undefined}
          nextAction={{ label: "افتح مهمة التدريب", href: "/computerized" }}
        />

        <section aria-labelledby="computerized-track-title">
          <div className="mb-3">
            <h2 id="computerized-track-title" className="text-xl font-black text-[#0D1B2A]">اختر المسار</h2>
            <p className="mt-1 text-sm text-[#64748B]">هذه هي الخطوة الأولى قبل اختيار نوع التدريب.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {TRACKS.map((track) => {
              const Icon = track.icon;
              const selected = activeTrack === track.key;
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
                      ? "border-[#0D1B2A] bg-[#0D1B2A] text-white shadow-md"
                      : "border-[#E2E8F0] bg-white text-[#0D1B2A] hover:-translate-y-0.5 hover:border-[#0D1B2A]/30 hover:shadow-sm"
                  }`}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-white/10 text-[#F7F775]" : track.key === "qudrat" ? "bg-[#EAF8F3] text-[#147D68]" : "bg-[#FFF0F2] text-[#C94C65]"}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-lg font-black">{track.title}</span>
                    <span className={`mt-1 block text-xs leading-5 ${selected ? "text-white/65" : "text-[#64748B]"}`}>{track.description}</span>
                  </span>
                  {selected && <CheckCircle2 className="mr-auto h-5 w-5 text-[#F7F775]" />}
                </button>
              );
            })}
          </div>
        </section>

        {activeTrack === "qudrat" && (
          <>
        <section aria-labelledby="computerized-options-title">
          <div className="mb-3">
            <h2 id="computerized-options-title" className="text-xl font-black text-[#0D1B2A]">اختر مسار التدريب</h2>
            <p className="mt-1 text-sm text-[#64748B]">ابدأ من النوع الذي تريد مراجعته الآن.</p>
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
                      ? "border-[#0D1B2A] bg-[#0D1B2A] text-white shadow-md"
                      : "border-[#E2E8F0] bg-white text-[#0D1B2A] hover:-translate-y-0.5 hover:border-[#0D1B2A]/30 hover:shadow-sm"
                  }`}
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${selected ? "bg-white/10 text-[#F7F775]" : `${mode.iconSurface} ${mode.accent}`}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-base font-black">{mode.title}</p>
                  <p className={`mt-1 text-xs leading-5 ${selected ? "text-white/65" : "text-[#64748B]"}`}>{mode.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {activeMode === "quantitative" && <SubjectWorkspace mode="quantitative" />}
        {activeMode === "verbal" && <SubjectWorkspace mode="verbal" />}
        {activeMode === "mixed" && <MixedWorkspace />}
        {activeMode === "search" && <SearchWorkspace />}
          </>
        )}
        {activeTrack === "tahsili" && <TahsiliWorkspace />}
      </div>
    </div>
  );
}