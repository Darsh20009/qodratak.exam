import React from "react";

interface BrandMarkProps {
  imageClassName?: string;
  className?: string;
}

export function BrandMark({
  imageClassName = "h-10 w-10",
  className = "",
}: BrandMarkProps) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/qodratak-icon-light.png"
        alt="قدراتك"
        width="42"
        height="42"
        className={`${imageClassName} object-contain dark:hidden`}
      />
      <img
        src="/qodratak-icon-dark.png"
        alt="قدراتك"
        width="42"
        height="42"
        className={`hidden ${imageClassName} object-contain dark:block`}
      />
      <span className="flex flex-col justify-center leading-none">
        <span className="text-base font-black tracking-tight text-[#171723] dark:text-white">
          قدراتك
        </span>
        <span
          dir="ltr"
          className="mt-1 text-[10px] font-semibold tracking-[0.16em] text-[#7D746D] dark:text-slate-400"
        >
          Qodratak
        </span>
      </span>
    </span>
  );
}