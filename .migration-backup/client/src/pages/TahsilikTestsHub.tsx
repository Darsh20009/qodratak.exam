import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";
import {
  GraduationCap, ChevronLeft, ChevronDown, ChevronUp,
  Settings, Crown, Target, Atom, TestTube, Dna, Calculator,
  TreePine, Clock, BookOpen, Zap, ArrowLeft, Star, Trophy,
  Brain, Layers, BarChart3, Sparkles, FileQuestion,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────

const SUBJECTS = [
  { name: "الفيزياء", icon: Atom, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400", questions: 450 },
  { name: "الكيمياء", icon: TestTube, color: "from-green-500 to-emerald-500", bg: "bg-green-500/10 border-green-500/20", text: "text-green-400", questions: 480 },
  { name: "الأحياء", icon: Dna, color: "from-green-600 to-amber-600", bg: "bg-green-100/10 border-green-400/20", text: "text-green-700", questions: 520 },
  { name: "الرياضيات", icon: Calculator, color: "from-orange-500 to-red-500", bg: "bg-orange-500/10 border-orange-500/20", text: "text-orange-400", questions: 400 },
  { name: "علم البيئة", icon: TreePine, color: "from-teal-500 to-emerald-500", bg: "bg-teal-500/10 border-teal-500/20", text: "text-teal-400", questions: 150 },
];

const COMPREHENSIVE_DIST = [
  { subject: "الفيزياء", count: 25, color: "bg-blue-500" },
  { subject: "الكيمياء", count: 25, color: "bg-green-500" },
  { subject: "الأحياء", count: 25, color: "bg-green-100" },
  { subject: "الرياضيات", count: 25, color: "bg-orange-500" },
  { subject: "علم البيئة", count: 10, color: "bg-teal-500" },
];

const STATS = [
  { label: "إجمالي الأسئلة", value: "2000+", icon: FileQuestion, color: "text-teal-700", bg: "bg-teal-100/10 border-teal-400/20" },
  { label: "الاختبارات", value: "3 أنواع", icon: Layers, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { label: "المواد", value: "5 مواد", icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "الطلاب", value: "15K+", icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
];

// ─── Collapsible exam card component ─────────────────────────────────

interface ExamCardProps {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  gradient: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  meta: Array<{ icon: React.ElementType; label: string }>;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ExamCard({ id, icon: Icon, title, subtitle, gradient, badge, badgeColor, description, meta, open, onToggle, children }: ExamCardProps) {
  return (
    <div className={cn("rounded-2xl border bg-card overflow-hidden transition-all duration-200", open ? "border-teal-400/40 shadow-md" : "border-border")} data-testid={`card-exam-${id}`}>
      {/* Card header — always visible */}
      <button className="w-full flex items-center gap-4 p-4 text-right" onClick={onToggle}>
        {/* Icon */}
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br text-white shadow-md", gradient)}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-foreground">{title}</span>
            {badge && (
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", badgeColor ?? "bg-amber-400/20 text-amber-400 border border-amber-400/30")}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        </div>

        {/* Chevron */}
        <div className={cn("w-7 h-7 rounded-lg border border-border flex items-center justify-center flex-shrink-0 transition-colors", open ? "bg-teal-100/10 border-teal-400/30" : "bg-muted/50")}>
          {open ? <ChevronUp className="w-4 h-4 text-teal-700" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2">
            {meta.map((m, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] bg-muted/60 border border-border px-2.5 py-1 rounded-full text-muted-foreground">
                <m.icon className="w-3 h-3" />
                {m.label}
              </div>
            ))}
          </div>

          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function TahsilikTestsHub() {
  const [, setLocation] = useLocation();
  const [openCard, setOpenCard] = useState<string | null>("comprehensive");

  const toggle = (id: string) => setOpenCard(prev => prev === id ? null : id);

  return (
    <>
      <SEO
        title="مركز اختبارات التحصيلي — منصة قدراتك"
        description="اختبارات تحصيلية شاملة وموضوعية في الفيزياء والكيمياء والأحياء والرياضيات"
        url="/tahsilik/tests-hub"
      />

      <div className="min-h-screen bg-background pb-24" dir="rtl">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

          {/* ── Hero ─────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-pink-600 to-emerald-600 p-6 text-white shadow-2xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-16 translate-x-12 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-8 -translate-x-8 blur-xl" />
            </div>
            <button
              onClick={() => setLocation("/tahsilik")}
              className="relative flex items-center gap-1.5 text-xs text-white/70 hover:text-white mb-3 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              الرئيسية
            </button>
            <div className="relative space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black">الاختبار التحصيلي</h1>
                  <p className="text-xs text-white/70">ابنّ ثقتك قبل يوم الاختبار</p>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                اختبارات شاملة وموضوعية في الفيزياء والكيمياء والأحياء والرياضيات وعلم البيئة
              </p>
            </div>
          </div>

          {/* ── Stats ────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-2">
            {STATS.map((s, i) => (
              <div key={i} className={cn("rounded-xl border p-2.5 text-center space-y-1", s.bg)}>
                <s.icon className={cn("w-4 h-4 mx-auto", s.color)} />
                <p className={cn("text-sm font-black", s.color)}>{s.value}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Exam Cards ────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground px-0.5">اختر نوع الاختبار:</p>

            {/* Comprehensive Exam */}
            <ExamCard
              id="comprehensive"
              icon={Crown}
              title="الاختبار الشامل"
              subtitle="110 سؤال — محاكاة كاملة للاختبار التحصيلي"
              gradient="from-green-600 to-rose-600"
              badge="الأكثر شمولاً"
              description="اختبار يغطي جميع المواد بتوزيع متوازن يشبه الاختبار الحقيقي. مثالي للمراجعة الشاملة قبل الاختبار."
              meta={[
                { icon: Clock, label: "180 دقيقة" },
                { icon: FileQuestion, label: "110 سؤال" },
                { icon: BarChart3, label: "متقدم" },
              ]}
              open={openCard === "comprehensive"}
              onToggle={() => toggle("comprehensive")}
            >
              {/* Distribution */}
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground">توزيع الأسئلة:</p>
                <div className="space-y-1.5">
                  {COMPREHENSIVE_DIST.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-16 text-[10px] text-muted-foreground text-right flex-shrink-0">{d.subject}</div>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", d.color)} style={{ width: `${(d.count / 110) * 100}%` }} />
                      </div>
                      <div className="text-[10px] text-muted-foreground w-6 text-center flex-shrink-0">{d.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setLocation("/tahsilik/comprehensive-test")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-rose-600 text-white text-sm font-black hover:opacity-90 transition-opacity"
                data-testid="btn-comprehensive"
              >
                ابدأ الاختبار الشامل
              </button>
            </ExamCard>

            {/* Custom Exam */}
            <ExamCard
              id="custom"
              icon={Settings}
              title="اختبار مخصص"
              subtitle="اختر المادة والمستوى وعدد الأسئلة"
              gradient="from-blue-600 to-teal-500"
              description="بنِ اختباراً حسب احتياجاتك بالضبط — اختر المادة والمستوى وعدد الأسئلة والوقت."
              meta={[
                { icon: Clock, label: "وقت مرن" },
                { icon: FileQuestion, label: "عدد مرن" },
                { icon: Target, label: "مستوى مرن" },
              ]}
              open={openCard === "custom"}
              onToggle={() => toggle("custom")}
            >
              <div className="grid grid-cols-3 gap-2 text-center">
                {["سهل", "متوسط", "صعب"].map((lvl, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/30 py-2 text-xs font-semibold text-foreground">
                    {lvl}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setLocation("/tahsilik/custom-test")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-black hover:opacity-90 transition-opacity"
                data-testid="btn-custom"
              >
                بناء اختبار مخصص
              </button>
            </ExamCard>

            {/* Subject-specific Exam */}
            <ExamCard
              id="subject"
              icon={Target}
              title="اختبار موضوعي"
              subtitle="20 سؤال — تركيز على مادة واحدة"
              gradient="from-emerald-600 to-teal-600"
              description="ركّز طاقتك على مادة بعينها لتكتشف نقاط قوتك وضعفك بدقة."
              meta={[
                { icon: Clock, label: "30 دقيقة" },
                { icon: FileQuestion, label: "20 سؤال" },
                { icon: Zap, label: "مركّز" },
              ]}
              open={openCard === "subject"}
              onToggle={() => toggle("subject")}
            >
              {/* Subject grid */}
              <div className="grid grid-cols-3 gap-2">
                {SUBJECTS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setLocation(`/tahsilik/tests/subject?subject=${encodeURIComponent(s.name)}`)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center hover:opacity-80 transition-opacity",
                      s.bg
                    )}
                    data-testid={`btn-subject-${i}`}
                  >
                    <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white", s.color)}>
                      <s.icon className="w-4 h-4" />
                    </div>
                    <span className={cn("text-[10px] font-bold", s.text)}>{s.name}</span>
                    <span className="text-[9px] text-muted-foreground">{s.questions} سؤال</span>
                  </button>
                ))}
              </div>
            </ExamCard>
          </div>

          {/* ── Quick Study Tips ────────────────────────────── */}
          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-black text-foreground">نصائح سريعة</span>
            </div>
            <div className="space-y-2">
              {[
                { icon: Star, text: "ابدأ بالأسئلة السهلة وارجع للصعبة", color: "text-amber-400" },
                { icon: Clock, text: "لا تتجاوز دقيقتين لكل سؤال", color: "text-blue-400" },
                { icon: Brain, text: "راجع الأخطاء فوراً بعد كل اختبار", color: "text-teal-700" },
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground">
                  <tip.icon className={cn("w-3.5 h-3.5 flex-shrink-0", tip.color)} />
                  {tip.text}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
