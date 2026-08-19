import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Menu, X } from "lucide-react";

const NAVY = "#0D1B2A";
const SIGNAL = "#F7F775";

const pathways = [
  ["01", "قدرات", "ابدأ بقياس مستواك، ثم رتّب تدريبك خطوة بخطوة."],
  ["02", "تحصيلي", "اجمع موادك وخطتك القادمة في مكان واحد واضح."],
  ["03", "IELTS", "مسار إضافي يمكنك استخدامه عندما تكون مستعدًا له."],
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="qodratak-focus-ring flex items-center gap-2.5 rounded-lg">
          <img src="/qodratak-logo.png" alt="قدراتك" className="h-10 w-10 rounded-lg object-cover object-top" />
          <div className="leading-tight">
            <span className="block text-base font-black text-white">قدراتك</span>
            <span className="block text-[9px] font-bold tracking-[0.16em] text-white/55">QIROX STUDIO</span>
          </div>
        </Link>

        <div className="hidden items-center gap-5 sm:flex">
          <Link href="/login" className="qodratak-focus-ring text-sm font-bold text-white/80 hover:text-white">
            تسجيل الدخول
          </Link>
          <Link href="/signup?type=student" className="qodratak-focus-ring rounded-lg px-4 py-2 text-sm font-black" style={{ background: SIGNAL, color: NAVY }}>
            أنشئ حسابًا
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="qodratak-focus-ring rounded-lg p-2 text-white sm:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 px-5 py-3 sm:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-bold text-white/85">
              تسجيل الدخول
            </Link>
            <Link href="/signup?type=student" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-black" style={{ background: SIGNAL, color: NAVY }}>
              أنشئ حسابًا
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900" dir="rtl">
      <section style={{ background: NAVY }}>
        <Header />
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-28">
          <p className="text-sm font-bold text-white/65">منصة قدراتك التعليمية</p>
          <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-6xl">
            استعد بوضوح،
            <br />
            <span style={{ color: SIGNAL }}>وتقدّم بثقة.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
            مكان واحد يساعدك على معرفة مستواك، تنظيم تدريبك، ومتابعة ما أنجزته.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup?type=student" className="qodratak-focus-ring inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-black" style={{ background: SIGNAL, color: NAVY }}>
              ابدأ الآن <ArrowLeft size={16} />
            </Link>
            <a href="#paths" className="qodratak-focus-ring rounded-lg border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
              تعرّف على المسارات
            </a>
          </div>
        </div>
      </section>

      <section id="paths" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-slate-400">بداية مرتبة</p>
          <h2 className="mt-2 text-3xl font-black leading-tight" style={{ color: NAVY }}>
            اختر مسارك، وابدأ من مكانك.
          </h2>
        </div>

        <div className="mt-10 grid border-t border-slate-200 md:grid-cols-3">
          {pathways.map(([number, title, description]) => (
            <article key={title} className="border-b border-slate-200 py-7 md:border-b-0 md:border-l md:px-7 md:first:pr-0 md:last:border-l-0">
              <p className="text-sm font-black text-slate-400">{number}</p>
              <h3 className="mt-5 text-xl font-black" style={{ color: NAVY }}>{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
              <Link href="/signup?type=student" className="qodratak-focus-ring mt-5 inline-flex items-center gap-1.5 text-sm font-black" style={{ color: NAVY }}>
                ابدأ المسار <ArrowLeft size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="text-sm font-bold text-slate-400">بلا تشتيت</p>
            <h2 className="mt-2 text-3xl font-black leading-tight" style={{ color: NAVY }}>
              تعرف أين أنت، وماذا تفعل بعد ذلك.
            </h2>
          </div>
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {[
              "قياس يساعدك على تحديد البداية.",
              "تدريب منظم يحافظ على تركيزك.",
              "متابعة واضحة لما أنجزته وما بقي.",
            ].map((item) => (
              <li key={item} className="py-4 text-sm font-bold text-slate-600">{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="border-r-4 px-6 py-3" style={{ borderColor: SIGNAL }}>
          <p className="text-sm font-bold text-slate-400">قدراتك من Qirox Studio</p>
          <h2 className="mt-2 text-3xl font-black" style={{ color: NAVY }}>رحلتك تبدأ بخطوة بسيطة.</h2>
          <Link href="/signup?type=student" className="qodratak-focus-ring mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-black" style={{ background: NAVY, color: "#fff" }}>
            أنشئ حسابًا <ArrowLeft size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-xs font-bold text-slate-400">
          <span>قدراتك</span>
          <span>QIROX STUDIO</span>
        </div>
      </footer>
    </main>
  );
}