import { BookOpen, Brain, ChevronLeft, FileText, GraduationCap, Library, PlayCircle, Target } from "lucide-react";
import { Link, useRoute } from "wouter";

type ProgramKey = "qudrat" | "tahsili" | "ielts" | "gat";

type ProgramItem = {
  title: string;
  description: string;
  href?: string;
  icon: typeof BookOpen;
};

type ProgramConfig = {
  arabic: string;
  english: string;
  description: string;
  foundation: ProgramItem[];
  computer: ProgramItem[];
};

const PROGRAMS: Record<ProgramKey, ProgramConfig> = {
  qudrat: {
    arabic: "القدرات",
    english: "Qudrat",
    description: "مسار القدرات العامة من التأسيس إلى المحاكاة.",
    foundation: [
      { title: "التأسيس الكمي", description: "أساسيات الجبر والهندسة والمهارات الكمية.", href: "/quantitative-tests", icon: Brain },
      { title: "التأسيس اللفظي", description: "فهم المقروء والتناظر وإكمال الجمل.", href: "/verbal-tests", icon: BookOpen },
      { title: "كتب القدرات", description: "كتب وملفات الشرح والمراجعة.", href: "/books", icon: FileText },
    ],
    computer: [
      { title: "الاختبارات المحاكية", description: "تجربة محاكية لاختبار قياس الكامل.", href: "/qiyas", icon: GraduationCap },
      { title: "اختبار كمي", description: "تدريب مركز على أسئلة القسم الكمي.", href: "/quantitative-tests", icon: Brain },
      { title: "اختبار لفظي", description: "تدريب مركز على أسئلة القسم اللفظي.", href: "/verbal-tests", icon: BookOpen },
      { title: "الملفات والمراجعة", description: "مراجعة الملفات المحفوظة من المكتبة.", href: "/library", icon: Library },
    ],
  },
  tahsili: {
    arabic: "التحصيلي",
    english: "Tahsili",
    description: "مسار التحصيلي بترتيب واضح للدراسة والاختبار.",
    foundation: [
      { title: "مركز الدراسة", description: "خطة ومحتوى تأسيسي حسب المادة.", href: "/tahsilik/study", icon: BookOpen },
      { title: "كتب التحصيلي", description: "الكتب والمواد المتاحة للتحصيلي.", href: "/books", icon: FileText },
      { title: "مكتبة التحصيلي", description: "ملفات ومواد المراجعة.", href: "/library", icon: Library },
    ],
    computer: [
      { title: "الاختبارات المحاكية", description: "اختبارات تدريبية ومتكاملة للتحصيلي.", href: "/tahsilik/tests", icon: GraduationCap },
      { title: "بنك التحصيلي", description: "تدريب حسب المواد والمستوى.", href: "/tahsilik/question-bank", icon: Brain },
      { title: "اختبار شامل", description: "اختبار شامل لقياس جاهزيتك.", href: "/tahsilik/comprehensive-test", icon: Target },
    ],
  },
  ielts: {
    arabic: "IELTS",
    english: "IELTS",
    description: "مسار اللغة الإنجليزية للاستعداد لاختبار IELTS.",
    foundation: [
      { title: "تأسيس اللغة", description: "محتوى تأسيسي للقراءة والاستماع والكتابة.", href: "/courses", icon: BookOpen },
      { title: "الكتب والملفات", description: "مواد اللغة المتاحة في المكتبة.", href: "/library", icon: FileText },
      { title: "خطة الدراسة", description: "نظرة منظمة على خطوات الاستعداد.", href: "/courses", icon: Target },
    ],
    computer: [
      { title: "اختبارات محاكية", description: "تدريب على شكل أقسام اختبار IELTS.", href: "/courses", icon: GraduationCap },
      { title: "تدريب المهارات", description: "تدريب منفصل على مهارات الاختبار.", href: "/courses", icon: PlayCircle },
      { title: "المكتبة", description: "الوصول إلى ملفات وكتب القسم.", href: "/library", icon: Library },
    ],
  },
  gat: {
    arabic: "غات",
    english: "GAT",
    description: "مسار GAT باللغة الإنجليزية بواجهة واضحة ومباشرة.",
    foundation: [
      { title: "التأسيس", description: "محتوى تأسيسي لفهم نمط الاختبار.", href: "/courses", icon: BookOpen },
      { title: "الكتب والملفات", description: "مواد المراجعة المتاحة.", href: "/library", icon: FileText },
      { title: "خطة الدراسة", description: "ترتيب خطوات الاستعداد للاختبار.", href: "/courses", icon: Target },
    ],
    computer: [
      { title: "اختبارات محاكية", description: "تدريب على شكل اختبار GAT.", href: "/courses", icon: GraduationCap },
      { title: "تدريب الأقسام", description: "اختبارات تدريبية حسب القسم.", href: "/courses", icon: PlayCircle },
      { title: "المكتبة", description: "الوصول إلى ملفات وكتب القسم.", href: "/library", icon: Library },
    ],
  },
};

function ContentCard({ item }: { item: ProgramItem }) {
  const content = (
    <div className="flex h-full items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#0D1B2A]/30 hover:shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E5E7EB] text-[#0D1B2A]">
        <item.icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-[#0D1B2A]">{item.title}</p>
        <p className="mt-1 text-xs leading-5 text-[#64748B]">{item.description}</p>
      </div>
      {item.href && <ChevronLeft className="mt-1 h-4 w-4 shrink-0 text-[#94A3B8]" />}
    </div>
  );

  return item.href ? <Link href={item.href}>{content}</Link> : content;
}

export default function StudentProgramPage() {
  const [, params] = useRoute("/student-program/:program");
  const programKey = params?.program as ProgramKey;
  const program = PROGRAMS[programKey] || PROGRAMS.qudrat;

  return (
    <div className="min-h-full bg-[#F7F4EE]" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-24 lg:px-8">
        <div className="flex items-center gap-3 text-sm text-[#64748B]">
          <Link href="/" className="hover:text-[#0D1B2A]">الرئيسية</Link>
          <ChevronLeft className="h-4 w-4" />
          <span className="font-bold text-[#0D1B2A]">{program.arabic}</span>
        </div>

        <header className="rounded-[26px] bg-[#0D1B2A] p-6 text-white sm:p-8">
          <p className="text-sm font-bold text-[#F7F775]">{program.english}</p>
          <h1 className="mt-2 text-3xl font-black">{program.arabic}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#CBD5E1]">{program.description}</p>
        </header>

        <section>
          <div className="mb-3">
            <h2 className="text-xl font-black text-[#0D1B2A]">التأسيس</h2>
            <p className="mt-1 text-sm text-[#64748B]">ابدأ من المستوى المناسب لك ثم انتقل للمرحلة التالية.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {program.foundation.map((item) => <ContentCard key={item.title} item={item} />)}
          </div>
        </section>

        <section>
          <div className="mb-3">
            <h2 className="text-xl font-black text-[#0D1B2A]">المحوسب</h2>
            <p className="mt-1 text-sm text-[#64748B]">اختبارات وتدريب عملي يحاكي تجربة الاختبار.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {program.computer.map((item) => <ContentCard key={item.title} item={item} />)}
          </div>
        </section>

        <div className="flex flex-wrap gap-3 border-t border-[#E5E7EB] pt-5">
          <Link href="/library" className="rounded-xl border border-[#0D1B2A]/15 bg-white px-4 py-3 text-sm font-bold text-[#0D1B2A] transition hover:border-[#0D1B2A]/40">
            <Library className="ml-2 inline h-4 w-4" />
            المكتبة المشتركة
          </Link>
          <Link href="/folders" className="rounded-xl border border-[#0D1B2A]/15 bg-white px-4 py-3 text-sm font-bold text-[#0D1B2A] transition hover:border-[#0D1B2A]/40">
            <FileText className="ml-2 inline h-4 w-4" />
            مجلداتي
          </Link>
        </div>
      </div>
    </div>
  );
}