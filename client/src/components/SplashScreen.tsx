import { useEffect, useState } from "react";

const NAVY = "#0D1B2A";
const SIGNAL = "#F7F775";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 200);
    const t2 = setTimeout(() => setPhase("out"), 2200);
    const t3 = setTimeout(() => onDone(), 2850);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: NAVY,
        opacity: phase === "out" ? 0 : 1,
        transform: phase === "out" ? "scale(1.04)" : "scale(1)",
        transition: phase === "out"
          ? "opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)"
          : "none",
      }}
    >
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(247,247,117,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(247,247,117,.06) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)",
        }}
      />

      {/* Glow ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 340,
          height: 340,
          background: `radial-gradient(circle, ${SIGNAL}18 0%, transparent 68%)`,
          opacity: phase === "hold" ? 1 : 0,
          transition: "opacity 0.9s ease",
        }}
      />

      {/* Logo block */}
      <div
        className="relative z-10 flex flex-col items-center"
        style={{
          opacity: phase === "in" ? 0 : 1,
          transform: phase === "in" ? "translateY(18px)" : "translateY(0)",
          transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.3,0.64,1)",
        }}
      >
        {/* Icon */}
        <div className="mb-6 overflow-hidden rounded-[22px] shadow-[0_0_0_1px_rgba(247,247,117,0.18),0_16px_48px_rgba(0,0,0,0.45)]" style={{ width: 80, height: 80 }}>
          <img src="/qodratak-logo.png" alt="قدراتك" className="h-full w-full object-cover object-top" />
        </div>

        {/* Word mark */}
        <div className="flex items-baseline gap-1" dir="rtl">
          <span
            className="font-black text-white"
            style={{ fontSize: 34, letterSpacing: "-0.01em", lineHeight: 1 }}
          >
            قدراتك
          </span>
          <span
            className="font-black"
            style={{ fontSize: 34, letterSpacing: "-0.01em", lineHeight: 1, color: SIGNAL }}
          >
            ك
          </span>
        </div>

        <span
          className="mt-1.5 font-bold tracking-[0.22em] text-white/40"
          style={{ fontSize: 10 }}
        >
          QIROX STUDIO
        </span>

        {/* Tagline */}
        <p
          className="mt-7 text-center font-bold text-white/55"
          style={{ fontSize: 13, maxWidth: 220, lineHeight: 1.6 }}
        >
          ذاكر بوضوح. تقدّم بثقة.
        </p>
      </div>

      {/* Loader bar */}
      <div
        className="absolute bottom-14 overflow-hidden rounded-full"
        style={{
          width: 72,
          height: 2,
          background: "rgba(255,255,255,0.12)",
          opacity: phase === "out" ? 0 : 1,
          transition: "opacity 0.3s",
        }}
      >
        <div
          style={{
            height: "100%",
            background: SIGNAL,
            borderRadius: 9999,
            width: phase === "hold" || phase === "out" ? "100%" : "0%",
            transition: phase === "hold" ? "width 1.85s cubic-bezier(0.4,0,0.2,1)" : "none",
          }}
        />
      </div>
    </div>
  );
}
