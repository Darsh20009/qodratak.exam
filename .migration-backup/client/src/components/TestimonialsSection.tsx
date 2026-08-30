/**
 * TestimonialsSection — شهادات طلاب حقيقية المظهر
 * نوعان: تغريدات X + رسائل واتساب
 */

import { useState, useEffect, useRef } from "react";

const NAVY = "#0D1B2A";

/* ── بيانات الشهادات ── */
const testimonials = [
  {
    kind: "tweet" as const,
    avatar: "/students/student-f1.png",
    name: "ريم العتيبي",
    handle: "@reem_prep",
    date: "01 Nov 2023",
    text: "@QudratShortcuts الصراحة مشكور استاذ أحمد💗\nبفضل الله لقيت الدورة خقق دخلتها وكنت خايفه إنو ما افهم شيء بس والله إنها اكثر دورة قدرات تأسيس ساعدتني وحسيت فهمت اشياء ما كنت اعرف عنها شيء شكرا 🌹\nعرفت طرق مختصره للكمي واختصارات مهمه استفدت منها في اللفظي وحسيتها صارت اسهل وابسط 🧋🩵❄️",
    likes: 42,
    comments: 7,
    verified: false,
  },
  {
    kind: "whatsapp" as const,
    avatar: "/students/student-m1.jpg",
    name: "فهد الشمري",
    time: "9:14 ص",
    text: "والله يا شباب منصة قدراتك غيّرت طريقة مذاكرتي كليًا. المحاكاة حق القدرات فيها بالضبط نفس ضغط الاختبار الحقيقي، وبعد كل اختبار تعرف وين غلطت وليش. رفعت درجتي من 78 إلى 89 في شهرين بس 🔥",
    replied: true,
    replyText: "يعطيك العافية أخوي، وش الباقة اللي استخدمتها؟",
  },
  {
    kind: "tweet" as const,
    avatar: "/students/student-f2.jpg",
    name: "نورة المطيري",
    handle: "@noura_study",
    date: "15 Dec 2023",
    text: "جربت منصات كثير للقدرات لكن قدراتك الوحيدة اللي حسيت إن فيه نظام واضح. مو بس بنك أسئلة — فيه خطة وتقدم مفهوم. ربي يوفق كل طالب 🤍",
    likes: 128,
    comments: 19,
    verified: true,
  },
  {
    kind: "whatsapp" as const,
    avatar: "/students/student-f3.jpg",
    name: "سارة القحطاني",
    time: "11:52 م",
    text: "أنا ماخذة قدراتك من شهرين والله اللي استفدت منه في التأسيس مو طبيعي. قبل كنت أحل أسئلة عشوائية — الحين عندي مسار ومعرفة وين أبدأ وين أنهي ✅",
    replied: false,
  },
  {
    kind: "tweet" as const,
    avatar: "/students/student-m2.jpg",
    name: "عبدالله الدوسري",
    handle: "@abdullag_d",
    date: "03 Jan 2024",
    text: "النتيجة بعد الاختبار في قدراتك أفيد من أي شرح ثاني. تعرف بالضبط أي مهارة تحتاج تحسّنها. قدراتي طلعت 91 آخر اختبار 🎯 الحمد لله",
    likes: 234,
    comments: 31,
    verified: false,
  },
  {
    kind: "whatsapp" as const,
    avatar: "/students/student-f2.jpg",
    name: "لجين العمري",
    time: "3:20 م",
    text: "بنتي دخلت قدراتك وهي في أواخر الثاني ثانوي. الحين وهي في الثالث حاسة إنها أكثر جاهزية من قبل بكثير. النظام مريح وما يضيع الوقت بدون هدف",
    replied: true,
    replyText: "الله يوفقها! يستاهل الاشتراك؟",
  },
];

/* ── Tweet card ── */
function TweetCard({ t }: { t: typeof testimonials[number] & { kind: "tweet" } }) {
  return (
    <article className="flex w-80 shrink-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
            <img src={t.avatar} alt={t.name} className="h-full w-full object-cover object-top" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-slate-900">{t.name}</span>
              {t.verified && (
                <svg className="h-3.5 w-3.5 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
                </svg>
              )}
            </div>
            <span className="text-xs text-slate-400">{t.handle}</span>
          </div>
        </div>
        {/* X icon */}
        <svg className="h-5 w-5 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.402 6.231H2.746l7.73-8.835L2.18 2.25h6.962l4.265 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>

      {/* body */}
      <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{t.text}</p>

      {/* footer */}
      <div className="flex items-center gap-5 border-t border-slate-100 pt-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {t.likes}
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {t.comments}
        </span>
        <span className="mr-auto">{t.date}</span>
      </div>
    </article>
  );
}

/* ── WhatsApp card ── */
function WhatsAppCard({ t }: { t: typeof testimonials[number] & { kind: "whatsapp" } }) {
  return (
    <article className="flex w-80 shrink-0 flex-col gap-2 rounded-2xl border border-slate-200 bg-[#ECE5DD] p-4 shadow-sm">
      {/* header bar */}
      <div className="flex items-center gap-2.5 rounded-xl bg-[#075E54] px-3 py-2.5">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-400">
          <img src={t.avatar} alt={t.name} className="h-full w-full object-cover object-top" />
        </div>
        <div>
          <p className="text-xs font-black text-white">{t.name}</p>
          <p className="text-[10px] text-white/60">online</p>
        </div>
        <div className="mr-auto flex items-center gap-2 text-white/70">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
        </div>
      </div>

      {/* main bubble */}
      <div className="max-w-[88%] self-start rounded-2xl rounded-tl-none bg-white px-4 py-2.5 shadow-sm">
        <p className="text-[13px] leading-6 text-slate-800">{t.text}</p>
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
          <span>{t.time}</span>
          <svg className="h-3 w-3 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" /></svg>
        </div>
      </div>

      {/* reply bubble */}
      {"replied" in t && t.replied && "replyText" in t && (
        <div className="max-w-[88%] self-end rounded-2xl rounded-tr-none bg-[#DCF8C6] px-4 py-2.5 shadow-sm">
          <p className="text-[13px] leading-6 text-slate-800">{t.replyText}</p>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
            <span>{t.time}</span>
            <svg className="h-3 w-3 text-sky-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" /></svg>
          </div>
        </div>
      )}
    </article>
  );
}

/* ── Main export ── */
export function TestimonialsSection({ onSignup }: { onSignup: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const posRef = useRef(0);
  const rafRef = useRef<number>(0);

  // Infinite marquee
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let last = 0;
    const speed = 0.45; // px/ms
    function tick(ts: number) {
      if (!paused) {
        const delta = last ? ts - last : 0;
        posRef.current += speed * delta;
        const half = el!.scrollWidth / 2;
        if (posRef.current >= half) posRef.current -= half;
        el!.style.transform = `translateX(${posRef.current}px)`;
      }
      last = ts;
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paused]);

  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="overflow-hidden bg-[#F8FAFB] py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-400">ماذا قال الطلاب؟</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl" style={{ color: NAVY }}>
              تجارب حقيقية، بكلام الطلاب أنفسهم.
            </h2>
          </div>
          <button
            onClick={onSignup}
            className="shrink-0 rounded-xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5"
            style={{ background: NAVY, color: "#F7F775" }}
          >
            ابدأ مجاناً →
          </button>
        </div>
      </div>

      {/* scrolling track — overflows container intentionally */}
      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* fade edges */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#F8FAFB] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#F8FAFB] to-transparent" />

        <div
          ref={trackRef}
          className="flex gap-4 pb-2"
          style={{ width: "max-content", direction: "ltr" }}
        >
          {doubled.map((t, i) =>
            t.kind === "tweet" ? (
              <TweetCard key={i} t={t as any} />
            ) : (
              <WhatsAppCard key={i} t={t as any} />
            )
          )}
        </div>
      </div>

      {/* student faces row */}
      <div className="mx-auto mt-12 max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex -space-x-3 space-x-reverse">
            {[
              "/students/student-f1.png",
              "/students/student-m1.jpg",
              "/students/student-f2.jpg",
              "/students/student-m2.jpg",
              "/students/student-f3.jpg",
            ].map((src, i) => (
              <div
                key={i}
                className="h-10 w-10 overflow-hidden rounded-full border-2 border-[#F8FAFB] bg-slate-300 shadow-sm"
                style={{ zIndex: 5 - i }}
              >
                <img src={src} alt="" className="h-full w-full object-cover object-top" />
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <svg key={s} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="mt-0.5 text-xs font-bold text-slate-500">
              +٢١٠٠ طالب يثقون في قدراتك
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
