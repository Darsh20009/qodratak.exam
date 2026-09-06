import { useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  BookOpen,
  BrainCircuit,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers,
  Loader2,
  Microscope,
  Target,
  TrendingUp,
} from "lucide-react";
import { useStudentDashboard } from "@/hooks/use-student";

type Track = "qudrat" | "tahsili";

const TRACKS = {
  qudrat: {
    label: "قدرات",
    description: "تدريب كمي ولفظي واختبارات مختلطة تحاكي قياس.",
    icon: BrainCircuit,
    color: "text-[#147D68]",
    surface: "bg-[#EAF8F3]",
    sections: [
      { title: "الاختبارات الكمية", description: "الجبر والهندسة والحساب والمقارنات", href: "/quantitative-tests", icon: Calculator },
      { title: "الاختبارات اللفظية", description: "التناظر وإكمال الجمل واستيعاب المقروء", href: "/verbal-tests", icon: BookOpen },
      { title: "الاختبارات المختلطة", description: "كمي ولفظي في محاكاة واحدة متوازنة", href: "/qiyas", icon: Activity },
      { title: "بنوك القدرات", description: "الأسئلة مرتبة في أقسام وبنوك واضحة", href: "/question-bank", icon: Layers },
    ],
  },
  tahsili: {
    label: "تحصيلي",
    description: "مراجعة المواد العلمية ثم قياس الاستعداد باختبارات شاملة.",
    icon: GraduationCap,
    color: "text-[#C94C65]",
    surface: "bg-[#FFF0F2]",
    sections: [
      { title: "تدريب المواد", description: "رياضيات وفيزياء وكيمياء وأحياء", href: "/tahsili", icon: Microscope },
      { title: "بنوك التحصيلي", description: "تجميعات وأسئلة مرتبة حسب المادة", href: "/tahsili/question-bank", icon: Layers },
      { title: "الاختبارات الشاملة", description: "محاكاة متكاملة لجميع مواد التحصيلي", href: "/tahsili/exams", icon: Activity },
      { title: "نتائجي وتقدمي", description: "راجع محاولاتك واعرف ما يحتاج مراجعة", href: "/records", icon: TrendingUp },
    ],
  },
} as const;

export default function ComputerizedPage() {
  const [activeTrack, setActiveTrack] = useState<Track>("qudrat");
  const { data: dashboard, isLoading } = useStudentDashboard();
  const track = TRACKS[activeTrack];
  const TrackIcon = track.icon;
  const completed = dashboard?.stats.totalTests ?? 0;
  const average = dashboard?.stats.averageScore ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-7 p-4 pb-10 md:p-8">
      <header className="overflow-hidden rounded-[1.75rem] bg-[#0D1B2A] p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-black text-[#F7F775]">مركز التدريب</p>
            <h1 className="text-3xl font-black">المحوسب</h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-white/65">
              اختر قدرات أو تحصيلي، ثم أكمل البنوك بالترتيب. نتيجتك وتقدمك محفوظان في حسابك.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{completed}</p>
              <p className="text-[11px] font-bold text-white/55">اختبار مكتمل</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{average}%</p>
              <p className="text-[11px] font-bold text-white/55">متوسط الأداء</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3" role="tablist" aria-label="اختر المسار">
        {(Object.keys(TRACKS) as Track[]).map((key) => {
          const item = TRACKS[key];
          const Icon = item.icon;
          const selected = activeTrack === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTrack(key)}
              className={`rounded-2xl border p-4 text-right transition-all md:p-5 ${
                selected
                  ? "border-[#0D1B2A] bg-[#0D1B2A] text-white shadow-md"
                  : "border-border bg-white text-foreground hover:-translate-y-0.5 hover:border-[#0D1B2A]/30 dark:bg-card"
              }`}
            >
              <Icon className={`mb-3 h-6 w-6 ${selected ? "text-[#F7F775]" : item.color}`} />
              <p className="text-lg font-black">{item.label}</p>
              <p className={`mt-1 text-xs font-medium leading-5 ${selected ? "text-white/60" : "text-muted-foreground"}`}>
                {item.description}
              </p>
            </button>
          );
        })}
      </div>

      <section className="rounded-[1.75rem] border border-border bg-white p-4 shadow-sm dark:bg-card md:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${track.surface} ${track.color}`}>
            <TrackIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-black text-foreground">اختبارات {track.label}</h2>
            <p className="mt-1 text-xs font-medium text-muted-foreground">ابدأ بالقسم الذي يناسب خطتك الحالية.</p>
          </div>
        </div>

        <div className="space-y-3">
          {track.sections.map((section, index) => {
            const Icon = section.icon;
            const recentMatch = dashboard?.recentTests.find((test) =>
              test.title.includes(activeTrack === "qudrat" ? "قدرات" : "تحصيلي"),
            );
            return (
              <Link key={section.href} href={section.href}>
                <div className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-[#F8FAFB] p-4 transition-all hover:-translate-y-0.5 hover:border-[#398B79]/50 hover:bg-white hover:shadow-md dark:bg-background md:p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0D1B2A] shadow-sm dark:bg-card dark:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                      <h3 className="font-black text-foreground">{section.title}</h3>
                    </div>
                    <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">{section.description}</p>
                  </div>
                  {recentMatch && index === 0 ? (
                    <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 sm:flex">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {recentMatch.score}%
                    </span>
                  ) : null}
                  <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-3">
          <Link href="/folders" className="rounded-2xl border border-border bg-white p-4 transition hover:border-[#398B79] dark:bg-card">
            <FolderOpen className="h-5 w-5 text-[#398B79]" />
            <p className="mt-3 font-black text-foreground">مجلداتي</p>
            <p className="mt-1 text-xs text-muted-foreground">{dashboard?.foldersCount ?? 0} مجلد محفوظ</p>
          </Link>
          <Link href="/records" className="rounded-2xl border border-border bg-white p-4 transition hover:border-[#398B79] dark:bg-card">
            <FileText className="h-5 w-5 text-[#398B79]" />
            <p className="mt-3 font-black text-foreground">سجل الاختبارات</p>
            <p className="mt-1 text-xs text-muted-foreground">{completed} نتيجة محفوظة</p>
          </Link>
          <Link href="/" className="rounded-2xl border border-border bg-white p-4 transition hover:border-[#398B79] dark:bg-card">
            <Target className="h-5 w-5 text-[#398B79]" />
            <p className="mt-3 font-black text-foreground">خطتي الحالية</p>
            <p className="mt-1 text-xs text-muted-foreground">{dashboard?.recommendedPlan.title || "العودة إلى لوحتي"}</p>
          </Link>
        </section>
      )}
    </div>
  );
}