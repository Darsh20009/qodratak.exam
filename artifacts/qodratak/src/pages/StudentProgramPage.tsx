import { BookOpen, Brain, ChevronLeft, FileText, GraduationCap, Library, Target } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useStudentDashboard } from "@/hooks/use-student";
import { Progress } from "@/components/ui/progress";
import ComputerizedPage from "@/pages/student/ComputerizedPage";

type ProgramKey = "qudrat" | "tahsili";

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
      { title: "التأسيس الكمي", description: "أساسيات الجبر والهندسة والمهارات الكمية.", href: "/foundation?program=qudrat&subject=quantitative", icon: Brain },
      { title: "التأسيس اللفظي", description: "فهم المقروء والتناظر وإكمال الجمل، مع بنوك الفيديو والاختبارات.", href: "/foundation?program=qudrat&subject=verbal", icon: BookOpen },
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
      { title: "الرياضيات", description: "شرح تأسيسي واختبار من بنك أسئلة الرياضيات.", href: "/foundation?program=tahsili&subject=math", icon: Brain },
      { title: "الفيزياء", description: "شرح تأسيسي واختبار من بنك أسئلة الفيزياء.", href: "/foundation?program=tahsili&subject=physics", icon: Target },
      { title: "الكيمياء", description: "شرح تأسيسي واختبار من بنك أسئلة الكيمياء.", href: "/foundation?program=tahsili&subject=chemistry", icon: BookOpen },
      { title: "الأحياء", description: "شرح تأسيسي واختبار من بنك أسئلة الأحياء.", href: "/foundation?program=tahsili&subject=biology", icon: GraduationCap },
    ],
    computer: [
      { title: "مركز الاختبارات", description: "اختر بين اختبار شامل أو حسب المادة أو اختبار مخصص.", href: "/tahsilik/tests", icon: GraduationCap },
      { title: "بنك أسئلة التحصيلي", description: "تدرّب حسب المادة ثم راجع إجاباتك وأخطاءك.", href: "/tahsilik/question-bank", icon: Brain },
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
  const [location] = useLocation();
  const programKey = params?.program as ProgramKey;
  const program = PROGRAMS[programKey] || PROGRAMS.qudrat;
  const section = new URLSearchParams(location.split("?")[1] || "").get("section");
  const { data: dashboard } = useStudentDashboard();
  if ((programKey === "qudrat" || programKey === "tahsili") && section === "computer") {
    return <ComputerizedPage key={programKey} initialTrack={programKey} />;
  }
  const showFoundation = !section || section === "foundation";
  const showComputer = !section || section === "computer";
  const qudratProgress = dashboard?.progress.qudrat.percentage || 0;
  const tahsiliProgress = dashboard?.progress.tahsili.percentage || 0;
  const practiceSectionTitle = "المحوسب";
  const practiceSectionDescription = "اختبارات وتدريب عملي يحاكي تجربة الاختبار.";

  return (
    <div className="min-h-full bg-background" dir="rtl">
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
          <div className="mt-6 grid gap-2 text-xs font-bold text-[#CBD5E1] sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"><span className="text-[#F7F775]">1</span> اختر مستواك</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"><span className="text-[#F7F775]">2</span> ادرس وتدرّب</div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"><span className="text-[#F7F775]">3</span> اختبر جاهزيتك</div>
          </div>
          <Link
            href={`/learning/today?programId=${programKey === "tahsili" ? "tahsili" : "qudrat"}`}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#F7F775] px-5 text-sm font-black text-[#0D1B2A] transition hover:bg-white"
          >
            ابدأ رحلة اليوم في {program.arabic}
          </Link>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "تقدم القدرات", value: qudratProgress, detail: `${dashboard?.progress.qudrat.questions || 0} سؤالًا` },
            { label: "تقدم التحصيلي", value: tahsiliProgress, detail: `${dashboard?.progress.tahsili.questions || 0} سؤالًا` },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-black text-[#0D1B2A]">{item.label}</span>
                <span className="text-lg font-black text-[#0D1B2A]">{item.value}%</span>
              </div>
              <Progress value={item.value} className="h-2 bg-[#E5E7EB] [&>div]:bg-[#0D1B2A]" />
              <p className="mt-2 text-xs text-[#64748B]">{item.detail} في الاختبارات السابقة</p>
            </div>
          ))}
        </section>

        {showFoundation && <section id="foundation">
          <div className="mb-3">
            <h2 className="text-xl font-black text-[#0D1B2A]">التأسيس</h2>
            <p className="mt-1 text-sm text-[#64748B]">ابدأ من المستوى المناسب لك ثم انتقل للمرحلة التالية.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {program.foundation.map((item) => <ContentCard key={item.title} item={item} />)}
          </div>
        </section>}

        {showComputer && <section id="computer">
          <div className="mb-3">
            <h2 className="text-xl font-black text-[#0D1B2A]">{practiceSectionTitle}</h2>
            <p className="mt-1 text-sm text-[#64748B]">{practiceSectionDescription}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {program.computer.map((item) => <ContentCard key={item.title} item={item} />)}
          </div>
        </section>}

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