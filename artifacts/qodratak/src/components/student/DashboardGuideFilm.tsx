import { useEffect, useState } from "react";
import { Link } from "wouter";
import { EyeOff, PlayCircle } from "lucide-react";
import { GuideFilm } from "@/components/GuideFilm";

// Presentation preference only. Scoped per student id so one account's choice
// never leaks into another account on the same browser.
const keyFor = (uid: string) => `qodratak.dashboard.guideFilm.hidden.v1.${uid}`;

function readHidden(uid: string | null) {
  if (!uid || typeof window === "undefined") return false;
  try { return window.localStorage.getItem(keyFor(uid)) === "1"; } catch { return false; }
}

export function DashboardGuideFilm({ studentId }: { studentId: unknown }) {
  const uid = studentId === undefined || studentId === null || studentId === "" ? null : String(studentId);
  const [state, setState] = useState(() => ({ uid, hidden: readHidden(uid) }));
  useEffect(() => {
    setState((cur) => (cur.uid === uid ? cur : { uid, hidden: readHidden(uid) }));
  }, [uid]);
  // Until state is re-read for the current account, use a fresh read (no stale cross-account value).
  const hidden = state.uid === uid ? state.hidden : readHidden(uid);

  const setHidden = (next: boolean) => {
    setState({ uid, hidden: next });
    if (!uid) return;
    try {
      if (next) window.localStorage.setItem(keyFor(uid), "1");
      else window.localStorage.removeItem(keyFor(uid));
    } catch { /* storage unavailable: session-only preference */ }
  };

  if (hidden) {
    return (
      <div className="flex flex-wrap items-center gap-2" data-testid="guide-film-hidden">
        <button
          type="button"
          onClick={() => setHidden(false)}
          data-testid="button-show-guide-film"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-black text-foreground hover:border-primary/40"
        >
          <PlayCircle className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          إظهار فيلم الاستخدام
        </button>
        <Link href="/how-it-works" data-testid="link-how-it-works-dashboard" className="text-xs font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground">
          دليل صفحات المنصة
        </Link>
      </div>
    );
  }

  return (
    <section aria-labelledby="dashboard-guide-title" data-testid="section-dashboard-guide-film" className="rounded-3xl border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <p id="dashboard-guide-title" className="inline-flex items-center gap-1.5 text-xs font-black text-primary">
          <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
          كيف تستخدم قدراتك؟
        </p>
        <div className="flex items-center gap-3">
          <Link href="/how-it-works" data-testid="link-how-it-works-dashboard" className="text-xs font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground">
            دليل الصفحات
          </Link>
          <button
            type="button"
            onClick={() => setHidden(true)}
            data-testid="button-hide-guide-film"
            className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-black text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            إخفاء
          </button>
        </div>
      </div>
      <GuideFilm compact chapter="dashboard" muted title="فيلم تعريفي: لوحتك في قدراتك" />
    </section>
  );
}
