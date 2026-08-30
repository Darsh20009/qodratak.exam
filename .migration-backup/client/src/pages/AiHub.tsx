import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import {
  TrendingUp, Zap, Search, MessageSquare, CalendarDays,
  Timer, Dna, Users, ArrowLeft, Lock, ChevronLeft,
  Sparkles, Brain, Target, BarChart3, AlertCircle
} from "lucide-react";

interface AiFeature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  href: string;
  status: "live" | "soon";
  accent: string;
  accentBg: string;
  tag?: string;
}

const AI_FEATURES: AiFeature[] = [
  {
    id: "score-prediction",
    title: "توقع درجة القياس",
    subtitle: "تحليل مسار الأداء",
    description: "نقدر درجتك المتوقعة في اختبار القياس الفعلي بناءً على تحليل أدائك عبر جميع الاختبارات، مع خارطة طريق للوصول إلى 80+.",
    icon: TrendingUp,
    href: "/ai-hub/score-prediction",
    status: "live",
    accent: "text-blue-400",
    accentBg: "bg-blue-500/10 border-blue-500/20",
    tag: "جديد",
  },
  {
    id: "pattern-analysis",
    title: "اكتشاف الأنماط الخفية",
    subtitle: "تحليل سلوكي عميق",
    description: "\"أنت تُخطئ 80% من الأسئلة بعد الدقيقة 3\" — كشف أنماط أعمق من مجرد عدد الإجابات الصحيحة.",
    icon: Search,
    href: "/ai-hub/pattern-analysis",
    status: "live",
    accent: "text-teal-700",
    accentBg: "bg-teal-100/10 border-teal-400/20",
    tag: "تحليلي",
  },
  {
    id: "daily-plan",
    title: "خطة المراجعة اليومية",
    subtitle: "جدول ذكي متجدد",
    description: "كل صباح تتحدث خطتك تلقائياً بناءً على آخر اختباراتك والوقت المتبقي لموعد قياس — مهام اليوم بالضبط.",
    icon: CalendarDays,
    href: "/ai-hub/daily-plan",
    status: "live",
    accent: "text-emerald-400",
    accentBg: "bg-emerald-500/10 border-emerald-500/20",
    tag: "يومي",
  },
  {
    id: "socratic-tutor",
    title: "المرشد السقراطي",
    subtitle: "تعلم بالتفكير لا بالحفظ",
    description: "بدلاً من إعطائك الجواب مباشرة، يطرح أسئلة توجيهية تدفعك للتفكير بنفسك حتى تصل للإجابة.",
    icon: MessageSquare,
    href: "/ai-tutor",
    status: "live",
    accent: "text-amber-400",
    accentBg: "bg-amber-500/10 border-amber-500/20",
    tag: "تفاعلي",
  },
  {
    id: "question-generator",
    title: "مولّد الأسئلة الشخصي",
    subtitle: "أسئلة مخصصة لنقاط ضعفك",
    description: "بدلاً من أسئلة ثابتة — يولّد أسئلة جديدة مشابهة لنقاط ضعفك تحديداً، مع صياغات مختلفة في كل مرة.",
    icon: Zap,
    href: "/ai-hub/question-generator",
    status: "soon",
    accent: "text-amber-700",
    accentBg: "bg-amber-100/10 border-pink-500/20",
    tag: "قريباً",
  },
  {
    id: "pressure-simulator",
    title: "محاكي ضغط الاختبار",
    subtitle: "تدريب على إدارة الوقت",
    description: "يرصد وقت كل سؤال ويعطي تنبيهات تدريبية \"تسرّع!\" أو \"تجاوز الآن\"، ويدرّب على الأداء تحت الضغط.",
    icon: Timer,
    href: "/ai-hub/pressure-simulator",
    status: "soon",
    accent: "text-rose-400",
    accentBg: "bg-rose-500/10 border-rose-500/20",
    tag: "قريباً",
  },
  {
    id: "question-dna",
    title: "تحليل نبرة السؤال",
    subtitle: "Question DNA",
    description: "يكشف الفخ المخفي في كل سؤال: \"هذا السؤال يستخدم النفي المزدوج\" أو \"الخياران A و C متشابهان عمداً لإرباكك\".",
    icon: Dna,
    href: "/ai-hub/question-dna",
    status: "soon",
    accent: "text-cyan-400",
    accentBg: "bg-cyan-500/10 border-cyan-500/20",
    tag: "قريباً",
  },
  {
    id: "peer-comparison",
    title: "مقارنة بالناجحين",
    subtitle: "تعلم من المتفوقين",
    description: "\"طلاب حصلوا على 90+ كانوا في نفس مستواك وفعلوا هذا...\" — توصيات مسار مبنية على بيانات الطلاب المشابهين.",
    icon: Users,
    href: "/ai-hub/peer-comparison",
    status: "soon",
    accent: "text-teal-700",
    accentBg: "bg-teal-100/10 border-teal-400/20",
    tag: "قريباً",
  },
];

function FeatureCard({ feature }: { feature: AiFeature }) {
  const Icon = feature.icon;
  const isLive = feature.status === "live";

  return (
    <Link href={isLive ? feature.href : "#"}>
      <div
        className={`group relative flex flex-col h-full rounded-2xl border bg-card transition-all duration-300 overflow-hidden cursor-pointer
          ${isLive
            ? "hover:border-white/20 hover:shadow-xl hover:-translate-y-0.5"
            : "opacity-60 cursor-default"
          }`}
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
        data-testid={`card-ai-${feature.id}`}
      >
        {/* Top accent line */}
        {isLive && (
          <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent ${feature.accent} opacity-30 group-hover:opacity-70 transition-opacity`} />
        )}

        <div className="p-5 flex flex-col gap-3 flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${feature.accentBg}`}>
              {isLive ? (
                <Icon className={`w-5 h-5 ${feature.accent}`} />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${feature.accentBg} ${feature.accent}`}>
              {feature.tag}
            </span>
          </div>

          {/* Title */}
          <div>
            <h3 className="font-bold text-foreground text-sm leading-tight">{feature.title}</h3>
            <p className={`text-xs mt-0.5 font-medium ${feature.accent}`}>{feature.subtitle}</p>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">{feature.description}</p>

          {/* Action */}
          {isLive && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${feature.accent} mt-1 group-hover:gap-2 transition-all`}>
              <span>فتح</span>
              <ChevronLeft className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function AiHub() {
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const liveFeatures = AI_FEATURES.filter(f => f.status === "live");
  const soonFeatures = AI_FEATURES.filter(f => f.status === "soon");

  return (
    <>
      <SEO title="مركز الذكاء - منصة قدراتك" description="8 أدوات ذكية تحلل أداءك وتوجهك نحو أعلى درجة في قياس" url="/ai-hub" />

      <div className="min-h-screen bg-background pb-24" dir="rtl">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link href="/">
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                  الرئيسية
                </button>
              </Link>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-lg flex-shrink-0">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-foreground">مركز الذكاء</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  8 أدوات تحليلية تعمل في الخلفية لتوجيهك نحو أعلى درجة
                </p>
              </div>
            </div>
          </div>

          {/* Live Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-semibold text-foreground">متاح الآن</h2>
              <span className="text-xs text-muted-foreground">({liveFeatures.length} أدوات)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {liveFeatures.map(f => <FeatureCard key={f.id} feature={f} />)}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground px-2">قيد التطوير</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Coming Soon Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">قريباً</h2>
              <span className="text-xs text-muted-foreground">({soonFeatures.length} أدوات)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {soonFeatures.map(f => <FeatureCard key={f.id} feature={f} />)}
            </div>
          </div>

          {/* Note */}
          <div className="flex gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-sm text-blue-400/80">
            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>جميع الأدوات تعمل في الخلفية بشكل تلقائي وتتعلم من أدائك في كل اختبار تجريه على المنصة.</p>
          </div>

        </div>
      </div>
    </>
  );
}
