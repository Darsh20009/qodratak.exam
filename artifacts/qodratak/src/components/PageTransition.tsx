import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const platformLogo = "/qodratak-icon.png";

export function BrandLoadingScreen({ label = "جارٍ فتح الصفحة..." }: { label?: string }) {
  return (
    <div
      className="qodratak-brand-loading grid min-h-[100dvh] place-items-center px-5 text-center"
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="qodratak-brand-loading-mark" aria-hidden="true">
          <span className="qodratak-brand-loading-ring" />
          <img src={platformLogo} alt="" className="qodratak-brand-loading-logo" />
        </div>
        <p className="text-sm font-bold text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const previousLocation = useRef<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (previousLocation.current === null) {
      previousLocation.current = location;
      return;
    }

    if (previousLocation.current === location) return;
    previousLocation.current = location;
    setIsVisible(true);

    const timeoutId = window.setTimeout(() => setIsVisible(false), 420);
    return () => window.clearTimeout(timeoutId);
  }, [location]);

  return (
    <>
      {children}
      {isVisible && (
        <div
          className="qodratak-page-transition"
          role="status"
          aria-live="polite"
          aria-label="جارٍ الانتقال بين الصفحات"
        >
          <div className="qodratak-page-transition-mark" aria-hidden="true">
            <span className="qodratak-page-transition-ring" />
            <img src={platformLogo} alt="" className="qodratak-page-transition-logo" />
          </div>
          <span className="qodratak-page-transition-label">قدراتك</span>
        </div>
      )}
    </>
  );
}