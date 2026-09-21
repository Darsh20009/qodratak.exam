import React from "react";
import { cn } from "@/lib/utils";

interface TahsiliPageFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function TahsiliPageFrame({ children, className }: TahsiliPageFrameProps) {
  return (
    <div dir="rtl" className={cn("qodratak-tahsili-surface min-h-[100dvh]", className)}>
      {children}
    </div>
  );
}

interface TahsiliSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function TahsiliSectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: TahsiliSectionHeaderProps) {
  return (
    <header className={cn("qodratak-tahsili-section-header", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="qodratak-tahsili-eyebrow">{eyebrow}</p>}
        <h1 className="qodratak-tahsili-title">{title}</h1>
        {description && <p className="qodratak-tahsili-description">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}