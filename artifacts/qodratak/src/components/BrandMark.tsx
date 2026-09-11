import React from "react";

interface BrandMarkProps {
  imageClassName?: string;
  className?: string;
  tone?: "auto" | "light" | "dark";
}

export function BrandMark({
  imageClassName = "h-10 w-10",
  className = "",
  tone = "auto",
}: BrandMarkProps) {
  const lightImageVisibility = tone === "light" ? "" : tone === "dark" ? "hidden" : "dark:hidden";
  const darkImageVisibility = tone === "dark" ? "" : tone === "light" ? "hidden" : "hidden dark:block";
  const primaryTextColor = tone === "light" ? "text-[#171723]" : tone === "dark" ? "text-white" : "text-[#171723] dark:text-white";
  const secondaryTextColor = tone === "light" ? "text-[#7D746D]" : tone === "dark" ? "text-slate-400" : "text-[#7D746D] dark:text-slate-400";

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/qodratak-icon-light.png"
        alt="قدراتك"
        width="42"
        height="42"
        className={`${imageClassName} object-contain ${lightImageVisibility}`}
      />
      <img
        src="/qodratak-icon-dark.png"
        alt="قدراتك"
        width="42"
        height="42"
        className={`${darkImageVisibility} ${imageClassName} object-contain`}
      />
      <span className="flex flex-col justify-center leading-none">
        <span className={`text-base font-black tracking-tight ${primaryTextColor}`}>
          قدراتك
        </span>
        <span
          dir="ltr"
          className={`mt-1 text-[10px] font-semibold tracking-[0.16em] ${secondaryTextColor}`}
        >
          Qodratak
        </span>
      </span>
    </span>
  );
}