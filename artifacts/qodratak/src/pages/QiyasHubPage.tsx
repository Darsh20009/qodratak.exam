import { useState } from "react";
import { useLocation } from "wouter";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import {
  Brain, Flame, AlignLeft, Hash, LayoutGrid,
  ChevronLeft, ChevronDown, Zap, Clock, Target, BarChart3,
  Sparkles, Shield, BookOpen, Trophy, Star
} from "lucide-react";

// ─────────────────────────── Types ───────────────────────────────
interface SubExam {
  examId: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  gradient: string;
  badge?: string;
  fullQuestions: number;
  fullMinutes: number;
  sections: Array<{ num: number; name: string; questions: number; minutes: number }>;
}

// ─────────────────────── الاختبارات الأربعة ──────────────────────
const TAHSILI_EXAMS: SubExam[] = [
  {
    examId: 1,
    label: "قدراتك التأهيلي الشامل",
    sublabel: "7 أقسام — لفظي + كمي مدمج — 120 سؤال",
    icon: Brain,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    gradient: "from-blue-600 to-teal-500",
    badge: "الأشمل",
    fullQuestions: 120,
    fullMinutes: 120,
    sections: [
      { num: 1, name: "القسم الأول",    questions: 24, minutes: 24 },
      { num: 2, name: "القسم الثاني",   questions: 24, minutes: 24 },
      { num: 3, name: "القسم الثالث",   questions: 24, minutes: 24 },
      { num: 4, name: "قدرات لفظية",   questions: 13, minutes: 13 },
      { num: 5, name: "قدرات كمية",    questions: 11, minutes: 11 },
      { num: 6, name: "قدرات لفظية",   questions: 13, minutes: 13 },
      { num: 7, name: "قدرات كمية",    questions: 11, minutes: 11 },
    ],
  },
  {
    examId: 2,
    label: "قدرات لفظية",
    sublabel: "5 أقسام لفظية — 65 سؤال",
    icon: AlignLeft,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    gradient: "from-emerald-600 to-green-600",
    fullQuestions: 65,
    fullMinutes: 65,
    sections: [
      { num: 1, name: "القسم الأول",  questions: 13, minutes: 13 },
      { num: 2, name: "القسم الثاني", questions: 13, minutes: 13 },
      { num: 3, name: "القسم الثالث", questions: 13, minutes: 13 },
      { num: 4, name: "القسم الرابع", questions: 13, minutes: 13 },
      { num: 5, name: "القسم الخامس", questions: 13, minutes: 13 },
    ],
  },
  {
    examId: 3,
    label: "قدرات كمية",
    sublabel: "5 أقسام كمية — 55 سؤال",
    icon: Hash,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/25",
    gradient: "from-orange-600 to-red-500",
    fullQuestions: 55,
    fullMinutes: 55,
    sections: [
      { num: 1, name: "القسم الأول",  questions: 11, minutes: 11 },
      { num: 2, name: "القسم الثاني", questions: 11, minutes: 11 },
      { num: 3, name: "القسم الثالث", questions: 11, minutes: 11 },
      { num: 4, name: "القسم الرابع", questions: 11, minutes: 11 },
      { num: 5, name: "القسم الخامس", questions: 11, minutes: 11 },
    ],
  },
  {
    examId: 5,
    label: "اختبار قدراتك",
    sublabel: "7 أقسام تدريبي — 120 سؤال",
    icon: Trophy,
    color: "text-teal-700",
    bg: "bg-teal-100/10",
    border: "border-teal-400/25",
    gradient: "from-green-500 to-emerald-600",
    badge: "مجاني",
    fullQuestions: 120,
    fullMinutes: 120,
    sections: [
      { num: 1, name: "القسم الأول",  questions: 24, minutes: 24 },
      { num: 2, name: "القسم الثاني", questions: 24, minutes: 24 },
      { num: 3, name: "القسم الثالث", questions: 24, minutes: 24 },
      { num: 4, name: "قدرات كمية",   questions: 11, minutes: 11 },
      { num: 5, name: "قدرات لفظية",  questions: 13, minutes: 13 },
      { num: 6, name: "قدرات كمية",   questions: 11, minutes: 11 },
      { num: 7, name: "قدرات لفظية",  questions: 13, minutes: 13 },
    ],
  },
];

const NEMR_SECTIONS = [
  { num: 1, name: "القسم الأول",  questions: 25, minutes: 26 },
  { num: 2, name: "القسم الثاني", questions: 25, minutes: 26 },
  { num: 3, name: "القسم الثالث", questions: 25, minutes: 26 },
  { num: 4, name: "القسم الرابع", questions: 25, minutes: 26 },
  { num: 5, name: "القسم الخامس", questions: 25, minutes: 26 },
];

// ──────────────────────────── Component ──────────────────────────────
export default function QiyasHubPage() {
  const [, setLocation] = useLocation();
  const [activeSystem, setActiveSystem] = useState<"normal" | "nemr">("normal");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<number | null>(null);
  const [showNemrSections, setShowNemrSections] = useState(false);

  const navigate = (path: string) => setLocation(path);

  const handleFullExam = (examId: number) =>
    navigate(`/qiyas?examId=${examId}`);

  const handleSection = (examId: number, sectionNum: number) =>
    navigate(`/qiyas?examId=${examId}&sectionOnly=${sectionNum}`);

  return (
    <>
      <SEO
        title="اختبارات القياس — منصة قدراتك"
        description="اختر نظام الاختبار وابدأ التدريب على اختبار القدرات العامة"
        url="/qiyas-hub"
      />

      <div className="min-h-screen bg-background pb-24" dir="rtl">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

          {/* ── Header ── */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">اختبارات القياس</h1>
              <p className="text-xs text-muted-foreground mt-0.5">قدرات التأهيلي — اختر النظام وابدأ</p>
            </div>
          </div>

          {/* ── System toggle ── */}
          <div className="flex gap-2 p-1 rounded-2xl bg-muted/50 border border-border">
            <button
              onClick={() => setActiveSystem("normal")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200",
                activeSystem === "normal"
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="btn-system-normal"
            >
              <BarChart3 className="w-4 h-4" />
              النظام العادي
            </button>
            <button
              onClick={() => setActiveSystem("nemr")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200",
                activeSystem === "nemr"
                  ? "bg-rose-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="btn-system-nemr"
            >
              <Flame className="w-4 h-4" />
              نظام نمر
            </button>
          </div>

          {/* ════════════ NORMAL SYSTEM ════════════ */}
          {activeSystem === "normal" && (
            <div className="space-y-3">
              {/* Section label */}
              <div className="flex items-center gap-2 px-1">
                <Star className="w-3.5 h-3.5 text-teal-700" />
                <p className="text-xs font-semibold text-muted-foreground">
                  قدرات التأهيلي — اختر الاختبار ثم حدد كامل أو قسم واحد
                </p>
              </div>

              {TAHSILI_EXAMS.map((exam) => {
                const isExpanded = expandedId === exam.examId;
                const isSectionsExpanded = expandedSections === exam.examId;
                const Icon = exam.icon;

                return (
                  <div
                    key={exam.examId}
                    className={cn(
                      "rounded-2xl border bg-card overflow-hidden transition-all duration-300",
                      exam.border,
                      isExpanded ? "shadow-lg" : "shadow-sm"
                    )}
                  >
                    {/* Card header */}
                    <button
                      className="w-full flex items-center gap-3 p-4 text-right"
                      onClick={() => {
                        setExpandedId(isExpanded ? null : exam.examId);
                        if (!isExpanded) setExpandedSections(null);
                      }}
                      data-testid={`btn-exam-card-${exam.examId}`}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
                        exam.bg, exam.border
                      )}>
                        <Icon className={cn("w-5 h-5", exam.color)} />
                      </div>
                      <div className="flex-1 text-right min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground">{exam.label}</span>
                          {exam.badge && (
                            <span className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                              exam.bg, exam.border, exam.color
                            )}>
                              {exam.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{exam.sublabel}</p>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
                        isExpanded && "rotate-180"
                      )} />
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">

                        {/* Stats row */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <BarChart3 className={cn("w-3 h-3", exam.color)} />
                            {exam.fullQuestions} سؤال
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className={cn("w-3 h-3", exam.color)} />
                            {exam.fullMinutes} دقيقة
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Zap className={cn("w-3 h-3", exam.color)} />
                            {exam.sections.length} أقسام
                          </div>
                        </div>

                        {/* Full exam button */}
                        <button
                          onClick={() => handleFullExam(exam.examId)}
                          className={cn(
                            "w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow",
                            `bg-gradient-to-r ${exam.gradient}`
                          )}
                          data-testid={`btn-full-exam-${exam.examId}`}
                        >
                          <Sparkles className="w-4 h-4" />
                          اختبار كامل — {exam.fullQuestions} سؤال / {exam.fullMinutes} دقيقة
                        </button>

                        {/* Section selector toggle */}
                        <button
                          onClick={() => setExpandedSections(isSectionsExpanded ? null : exam.examId)}
                          className={cn(
                            "w-full py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
                            exam.border, exam.color,
                            isSectionsExpanded ? exam.bg : "hover:" + exam.bg
                          )}
                          data-testid={`btn-section-toggle-${exam.examId}`}
                        >
                          <Target className="w-4 h-4" />
                          قسم واحد فقط
                          <ChevronDown className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            isSectionsExpanded && "rotate-180"
                          )} />
                        </button>

                        {/* Sections grid */}
                        {isSectionsExpanded && (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 pt-1">
                            {exam.sections.map((sec) => (
                              <button
                                key={sec.num}
                                onClick={() => handleSection(exam.examId, sec.num)}
                                className={cn(
                                  "flex flex-col items-start gap-0.5 p-3 rounded-xl border text-right hover:shadow-md transition-all duration-150",
                                  exam.bg, exam.border
                                )}
                                data-testid={`btn-section-${exam.examId}-${sec.num}`}
                              >
                                <span className={cn("text-xs font-bold", exam.color)}>{sec.name}</span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {sec.questions}س / {sec.minutes}د
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Info note */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/40 border border-border mt-2">
                <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  يمكنك اختيار اختبار كامل لمحاكاة بيئة قياس الحقيقية، أو اختيار قسم واحد للتدريب المركّز على جزء محدد.
                </p>
              </div>
            </div>
          )}

          {/* ════════════ NEMR SYSTEM ════════════ */}
          {activeSystem === "nemr" && (
            <div className="space-y-4">

              {/* Nemr intro card */}
              <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-orange-500/5 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-black text-foreground">اختبار نظام نمر</h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400">
                        مدمج
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      5 أقسام متكاملة — كل قسم 25 سؤالاً (13 لفظي + 12 كمي) في 26 دقيقة مع استراحة 30 ثانية بين الأقسام
                    </p>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 pt-1 border-t border-rose-500/20 flex-wrap">
                  {[
                    { icon: BarChart3, label: "125 سؤال" },
                    { icon: Clock,     label: "130 دقيقة" },
                    { icon: Zap,       label: "5 أقسام" },
                    { icon: Shield,    label: "لفظي + كمي" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <s.icon className="w-3 h-3 text-rose-400" />
                      {s.label}
                    </div>
                  ))}
                </div>

                {/* Full nemr exam */}
                <button
                  onClick={() => navigate("/qiyas?examId=7")}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 text-white text-sm font-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
                  data-testid="btn-nemr-full"
                >
                  <Flame className="w-4 h-4" />
                  اختبار نمر الكامل — 5 أقسام / 125 سؤال
                </button>

                {/* Section selector toggle */}
                <button
                  onClick={() => setShowNemrSections(v => !v)}
                  className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-400 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-colors"
                  data-testid="btn-nemr-section-toggle"
                >
                  <Target className="w-4 h-4" />
                  قسم واحد من نمر
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    showNemrSections && "rotate-180"
                  )} />
                </button>
              </div>

              {/* Nemr section grid */}
              {showNemrSections && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground px-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    اختر قسماً واحداً من اختبار نمر
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {NEMR_SECTIONS.map((sec) => (
                      <button
                        key={sec.num}
                        onClick={() => handleSection(7, sec.num)}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 text-right hover:bg-rose-500/15 hover:shadow-md transition-all duration-150"
                        data-testid={`btn-nemr-section-${sec.num}`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-orange-500 flex items-center justify-center flex-shrink-0 text-white font-black text-sm">
                          {sec.num}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground">{sec.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {sec.questions} سؤال — {sec.minutes} دقيقة
                          </p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Info note */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/40 border border-border">
                <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  نظام نمر هو بنية الاختبار الجديدة في قياس: كل قسم يجمع الأسئلة اللفظية والكمية معاً في نفس الوقت، مما يحاكي بيئة الاختبار الرسمي بدقة أعلى.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
