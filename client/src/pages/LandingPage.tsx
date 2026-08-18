import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import {
  Brain, Target, Trophy, Zap, Star, BookOpen, Users, CheckCircle,
  BarChart3, Clock, GraduationCap, FileText, TrendingUp, Medal,
  Menu, X, ArrowLeft, Layers, Gamepad2, ChevronLeft, Crown,
  Flame, MessageCircle, Play, Shield
} from "lucide-react";

const PRIMARY = "#1a7c3e";
const PRIMARY_LIGHT = "#e8f5ee";
const PRIMARY_DARK = "#145f30";

function useCountUp(target: number, duration = 1800, active = false) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setN(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return n;
}

const stats = [
  { value: 5565, suffix: "+", label: "سؤال تدريبي", icon: BookOpen },
  { value: 10000, suffix: "+", label: "طالب مسجّل", icon: Users },
  { value: 36, suffix: "", label: "نموذج ورقي", icon: FileText },
  { value: 98, suffix: "%", label: "نسبة رضا الطلاب", icon: Star },
];

const features = [
  {
    icon: GraduationCap,
    title: "محاكاة اختبار قياس الحقيقي",
    desc: "اختبر نفسك بنفس آلية قياس الرسمي — 7 أقسام، توقيت دقيق، تصحيح فوري بالذكاء الاصطناعي",
    badge: "الأكثر شيوعاً",
    color: "#1a7c3e",
    bg: "#e8f5ee",
  },
  {
    icon: Brain,
    title: "بنك أسئلة 5,565+ سؤال",
    desc: "أسئلة لفظية وكمية بمستويات متدرّجة مع شروحات تفصيلية واستراتيجيات الحل",
    badge: "5,565 سؤال",
    color: "#1d4ed8",
    bg: "#dbeafe",
  },
  {
    icon: BarChart3,
    title: "تحليل أدائك الذكي",
    desc: "رسوم بيانية تفصيلية تكشف نقاط قوتك وضعفك — اعرف أين تصرف وقتك بدقة",
    badge: "ذكاء اصطناعي",
    color: "#6d28d9",
    bg: "#ede9fe",
  },
  {
    icon: FileText,
    title: "36 نموذج ورقي حقيقي",
    desc: "نماذج من اختبارات قياس السابقة مع نماذج الإجابة — الأقرب لما ستواجهه فعلاً",
    badge: "36 نموذج",
    color: "#b45309",
    bg: "#fef3c7",
  },
  {
    icon: Gamepad2,
    title: "اختبار جماعي مباشر",
    desc: "نافس أصدقاءك في الوقت الفعلي — من يجيب أسرع وأدق؟ دراسة تبدو كلعبة",
    badge: "🔥 جديد",
    color: "#be123c",
    bg: "#ffe4e6",
  },
  {
    icon: Layers,
    title: "بطاقات المراجعة السريعة",
    desc: "راجع أهم القواعد والاستراتيجيات في دقائق قبل يوم الاختبار",
    badge: "مراجعة سريعة",
    color: "#0891b2",
    bg: "#cffafe",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "سجّل مجاناً في ثوانٍ",
    desc: "لا بطاقة ائتمانية. 7 أيام تجربة مجانية كاملة لجميع الميزات.",
    icon: Users,
  },
  {
    step: "02",
    title: "اختر طريقة تدريبك",
    desc: "محاكاة قياس كاملة، بنك أسئلة، نماذج ورقية — أنت تقرر.",
    icon: Target,
  },
  {
    step: "03",
    title: "تدرّب وتحلّل وتحسّن",
    desc: "اقرأ شروحات الأسئلة وشاهد تقدمك في لوحة التحليل الذكية.",
    icon: TrendingUp,
  },
  {
    step: "04",
    title: "ادخل الاختبار بثقة",
    desc: "بعد التدريب المكثف، ستدخل قياس وأنت جاهز على أعلى مستوى.",
    icon: Trophy,
  },
];

const testimonials = [
  {
    name: "عبدالرحمن المطيري",
    score: "97",
    prev: "72",
    period: "شهرين",
    text: "كانت درجتي 72 وكنت يائس. بعد شهرين على قدراتك وصلت 97. الأسئلة دقيقة جداً وأقرب للاختبار الحقيقي من أي مصدر ثاني.",
    avatar: "ع",
    color: "#1a7c3e",
  },
  {
    name: "نورة العتيبي",
    score: "95",
    prev: "68",
    period: "شهر ونصف",
    text: "الشروحات التفصيلية غيّرت فهمي للكمي. ما كنت أفهم الاحتمالات، بعد قدراتك صارت من أقوى نقاطي. شكراً!",
    avatar: "ن",
    color: "#1d4ed8",
  },
  {
    name: "خالد الشهري",
    score: "93",
    prev: "75",
    period: "3 أشهر",
    text: "الاختبار الجماعي مع الأصدقاء حوّل الدراسة لمتعة. كنا نتنافس كل يوم وتحسّنت نتائجنا كلنا. محاكاة قياس 1:1 مطابقة.",
    avatar: "خ",
    color: "#7c3aed",
  },
];

const plans = [
  {
    name: "مجاني",
    price: "0",
    period: "",
    desc: "ابدأ رحلتك بدون تكلفة",
    features: ["50 سؤال تجريبي", "اختبار مستوى أساسي", "الانضمام للاختبار الجماعي"],
    cta: "ابدأ مجاناً",
    href: "/signup",
    accent: "#6b7280",
    popular: false,
    badge: null,
  },
  {
    name: "Pro",
    price: "29",
    period: "/ شهر",
    desc: "للتحضير الجاد والمنهجي",
    features: [
      "5,565+ سؤال كامل مع شروحات",
      "محاكاة كاملة لاختبار قياس",
      "إنشاء وإدارة اختبار جماعي",
      "تحليل أداء متقدم + رسوم بيانية",
      "36 نموذج ورقي من قياس السابقة",
      "بطاقات مراجعة + اختبار تكيفي",
      "دعم فني على مدار الساعة",
    ],
    cta: "اشترك الآن",
    href: "/subscription",
    accent: "#1a7c3e",
    popular: true,
    badge: "⭐ الأكثر شراءً",
  },
  {
    name: "Pro Life Plus",
    price: "199",
    period: "/ سنة",
    desc: "الوصول مدى الحياة — القيمة الأعلى",
    features: [
      "كل مميزات Pro",
      "وصول مدى الحياة بدون تجديد",
      "أسئلة حصرية VIP",
      "شهادة إتمام معتمدة",
      "مجتمع المتميزين الخاص",
      "دعم أولوية قصوى 24/7",
    ],
    cta: "💎 احصل عليه الآن",
    href: "/subscription",
    accent: "#b45309",
    popular: false,
    badge: "💎 أفضل قيمة",
  },
];

const navLinks = [
  { label: "المميزات", href: "#features" },
  { label: "كيف يعمل", href: "#how" },
  { label: "الأسعار", href: "#pricing" },
  { label: "آراء الطلاب", href: "#reviews" },
];

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-sm border-b border-gray-100" : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform">
            <img src="/logo-512x512.png" alt="قدراتك" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-xl" style={{ color: PRIMARY }}>قدراتك</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all">
            تسجيل الدخول
          </Link>
          <Link
            href="/signup"
            className="text-sm font-bold text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: PRIMARY }}
          >
            ابدأ مجاناً
          </Link>
        </div>

        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-gray-700">
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <Link href="/login" className="flex-1 text-center py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700">
              دخول
            </Link>
            <Link href="/signup" className="flex-1 text-center py-2.5 text-sm font-bold text-white rounded-xl" style={{ background: PRIMARY }}>
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const c0 = useCountUp(5565, 1600, visible);
  const c1 = useCountUp(10000, 1800, visible);
  const c2 = useCountUp(36, 1200, visible);
  const c3 = useCountUp(98, 1400, visible);
  const counts = [c0, c1, c2, c3];

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {stats.map((s, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: PRIMARY_LIGHT }}>
            <s.icon size={20} style={{ color: PRIMARY }} />
          </div>
          <div className="text-2xl md:text-3xl font-black" style={{ color: PRIMARY }}>
            {visible ? counts[i].toLocaleString("ar-SA") : "—"}{s.suffix}
          </div>
          <div className="text-xs md:text-sm text-gray-500 mt-1 font-medium">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden" dir="rtl">
      <NavBar />

      {/* ══════════ HERO ══════════ */}
      <section id="hero" className="pt-28 pb-16 md:pt-36 md:pb-20 px-4" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #ffffff 60%, #eff6ff 100%)" }}>
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 border" style={{ background: PRIMARY_LIGHT, color: PRIMARY, borderColor: "#a7f3c0" }}>
            <Flame size={15} />
            المنصة الأكثر دقةً في محاكاة اختبار قياس
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-5">
            حقّق{" "}
            <span className="relative inline-block">
              <span style={{ color: PRIMARY }}>نتيجتك المثالية</span>
              <svg className="absolute -bottom-1 right-0 w-full" height="6" viewBox="0 0 200 6" fill="none">
                <path d="M0 3 Q100 0 200 3" stroke={PRIMARY} strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            {" "}في قياس
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            5,565+ سؤال حقيقي، محاكاة دقيقة لاختبار قياس، تحليل ذكي لأدائك — كل ما تحتاجه في مكان واحد
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: PRIMARY }}
            >
              <Play size={18} />
              ابدأ مجاناً — 7 أيام تجربة
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-gray-700 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-gray-300"
            >
              تسجيل الدخول
              <ChevronLeft size={18} />
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="flex -space-x-2 space-x-reverse">
              {["ع", "م", "س", "ن", "خ"].map((l, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: ["#1a7c3e", "#1d4ed8", "#7c3aed", "#be123c", "#b45309"][i] }}
                >
                  {l}
                </div>
              ))}
            </div>
            <span>+10,000 طالب يتدربون الآن على المنصة</span>
          </div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section className="py-10 px-4 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <StatsSection />
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
              لماذا قدراتك؟
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-gray-500 max-w-xl mx-auto">منصة متكاملة صُممت خصيصاً للطالب السعودي الذي يريد التحضير الجاد لاختبار قياس</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: f.bg }}>
                  <f.icon size={24} style={{ color: f.color }} />
                </div>
                <div className="inline-block px-2.5 py-1 rounded-md text-xs font-bold mb-3" style={{ background: f.bg, color: f.color }}>
                  {f.badge}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Advantage over competitor */}
          <div className="mt-10 rounded-2xl p-6 md:p-8" style={{ background: PRIMARY_LIGHT, border: `1px solid #a7f3c0` }}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-black mb-2" style={{ color: PRIMARY }}>لماذا قدراتك أفضل من الدورات التقليدية؟</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  الدورات تعطيك نظرياً — قدراتك تُدرّبك عملياً. الفرق بين من درس وبين من تدرّب.
                  اختبر نفسك بالأسئلة الحقيقية، وليس بالشروحات النظرية.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                {[
                  { label: "أسئلة حقيقية", v: "5,565+" },
                  { label: "نماذج سابقة", v: "36" },
                  { label: "تحليل ذكي", v: "فوري" },
                  { label: "محاكاة دقيقة", v: "100%" },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 text-center border border-green-100">
                    <div className="text-lg font-black" style={{ color: PRIMARY }}>{item.v}</div>
                    <div className="text-xs text-gray-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how" className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
              كيف تبدأ؟
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">أربع خطوات فقط للوصول لنتيجتك</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-8 right-[12.5%] left-[12.5%] h-0.5" style={{ background: `linear-gradient(90deg, ${PRIMARY}, transparent)` }} />
            {howItWorks.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md" style={{ background: i === 0 ? PRIMARY : "#f8fafc", border: i === 0 ? "none" : "2px solid #e2e8f0" }}>
                  <s.icon size={28} style={{ color: i === 0 ? "white" : PRIMARY }} />
                </div>
                <div className="text-xs font-black mb-1" style={{ color: PRIMARY }}>الخطوة {s.step}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section id="reviews" className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
              قصص نجاح حقيقية
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">طلاب غيّروا نتائجهم بقدراتك</h2>
            <p className="text-gray-500">ليس مجرد كلام — أرقام حقيقية من طلاب حقيقيين</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                {/* Score badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-black" style={{ background: t.color }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900">{t.name}</div>
                      <div className="text-xs text-gray-400">خلال {t.period}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 line-through">{t.prev}%</div>
                    <div className="text-2xl font-black" style={{ color: t.color }}>{t.score}%</div>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>قبل</span>
                    <span className="font-semibold" style={{ color: t.color }}>+{parseInt(t.score) - parseInt(t.prev)} نقطة</span>
                    <span>بعد</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${t.score}%`, background: t.color }} />
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">"{t.text}"</p>

                <div className="flex mt-3">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} fill={t.color} style={{ color: t.color }} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PRICING ══════════ */}
      <section id="pricing" className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4" style={{ background: PRIMARY_LIGHT, color: PRIMARY }}>
              الأسعار
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">استثمر في مستقبلك</h2>
            <p className="text-gray-500">ابدأ مجاناً — اشترك عندما تكون مستعداً</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {plans.map((p, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-6 relative transition-all hover:-translate-y-1 hover:shadow-lg ${
                  p.popular ? "border-2 shadow-xl" : "border-gray-100 bg-white"
                }`}
                style={p.popular ? { borderColor: p.accent, background: "#fafffe" } : {}}
              >
                {p.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
                    style={{ background: p.accent }}
                  >
                    {p.badge}
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-black text-gray-900">{p.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                </div>

                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-black" style={{ color: p.accent }}>{p.price}</span>
                  <span className="text-sm text-gray-400 font-medium">ر.س{p.period}</span>
                </div>

                <Link
                  href={p.href}
                  className="block w-full text-center py-3 rounded-xl text-sm font-bold mb-5 transition-all hover:-translate-y-0.5"
                  style={p.popular
                    ? { background: p.accent, color: "white", boxShadow: `0 4px 14px ${p.accent}40` }
                    : { background: "#f8fafc", color: "#374151", border: "1px solid #e5e7eb" }
                  }
                >
                  {p.cta}
                </Link>

                <ul className="space-y-2.5">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: p.accent }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            <Shield size={14} className="inline ml-1" />
            جميع الخطط تبدأ بتجربة مجانية 7 أيام — لا بطاقة ائتمانية مطلوبة
          </p>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="py-16 md:py-20 px-4" style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})` }}>
        <div className="max-w-3xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 bg-white/15 border border-white/20">
            <Trophy size={15} />
            انضم لأكثر من 10,000 طالب
          </div>

          <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight">
            درجتك في قياس تنتظرك
            <br />
            <span className="opacity-80 text-2xl md:text-3xl font-bold">ابدأ اليوم — مجاناً</span>
          </h2>

          <p className="text-base opacity-80 mb-8 max-w-lg mx-auto leading-relaxed">
            كل يوم تأخير هو يوم أقل تدرّباً. المنافسون يتدربون الآن — هل أنت معهم؟
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold bg-white hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              style={{ color: PRIMARY }}
            >
              <Play size={18} />
              أنشئ حسابك المجاني
            </Link>
            <Link
              href="/qiyas"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-white border-2 border-white/40 hover:bg-white/10 transition-all"
            >
              جرّب اختبار قياس
              <ArrowLeft size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden">
                <img src="/logo-512x512.png" alt="قدراتك" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-white font-bold">قدراتك</div>
                <div className="text-xs">منصة التحضير لاختبار قياس</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/signup" className="hover:text-white transition-colors">إنشاء حساب</Link>
              <Link href="/login" className="hover:text-white transition-colors">تسجيل الدخول</Link>
              <Link href="/subscription" className="hover:text-white transition-colors">الاشتراكات</Link>
              <a href="#features" className="hover:text-white transition-colors">المميزات</a>
              <a href="#pricing" className="hover:text-white transition-colors">الأسعار</a>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://t.me/qodratak"
                className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                target="_blank" rel="noopener noreferrer"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
            <p>© {new Date().getFullYear()} قدراتك — جميع الحقوق محفوظة | صُمِّم في المملكة العربية السعودية 🇸🇦</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
