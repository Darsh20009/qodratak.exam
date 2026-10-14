import { useEffect, useId, useState } from "react";
import { EyeOff, PlayCircle } from "lucide-react";
import { GuideFilm, guideFilmSrc } from "@/components/GuideFilm";
import { roleGuideHiddenKey, type GuideAudience } from "@/lib/guideViewer";

const LABELS: Record<GuideAudience, string> = {
  student: "دليل منصة قدراتك الكامل",
  admin: "دليل لوحة الإدارة وصفحاتها",
  institution: "دليل لوحة المؤسسة",
  teacher: "دليل مساحة المعلم",
};

function readHidden(audience: GuideAudience, uid: string | null) {
  if (!uid || typeof window === "undefined") return false;
  try { return window.localStorage.getItem(roleGuideHiddenKey(audience, uid)) === "1"; } catch { return false; }
}

export function RoleGuideFilm({ audience, viewerId, displayName }: {
  audience: GuideAudience; viewerId: unknown; displayName?: string;
}) {
  const uid = typeof viewerId === "string" || typeof viewerId === "number" ? String(viewerId) || null : null;
  const identity = `${audience}:${uid}`;
  const heading = useId();
  const [state, setState] = useState(() => ({ identity, hidden: readHidden(audience, uid) }));
  useEffect(() => {
    setState(cur => cur.identity === identity ? cur : { identity, hidden: readHidden(audience, uid) });
  }, [identity, audience, uid]);
  const hidden = state.identity === identity ? state.hidden : readHidden(audience, uid);
  const film = audience === "student" ? "guide" : audience;
  const fullHref = guideFilmSrc({ film });
  const setHidden = (next: boolean) => {
    setState({ identity, hidden: next });
    if (!uid) return;
    try {
      if (next) window.localStorage.setItem(roleGuideHiddenKey(audience, uid), "1");
      else window.localStorage.removeItem(roleGuideHiddenKey(audience, uid));
    } catch { /* Keep the preference in this session when storage is blocked. */ }
  };
  const title = LABELS[audience];
  return (
    <section data-testid={audience === "student" ? "section-dashboard-guide-film" : `section-${audience}-guide-film`}
      aria-labelledby={heading} className="mb-5 rounded-3xl border border-border bg-card p-3 text-foreground shadow-sm sm:p-4">
      <div className={`${hidden ? "" : "mb-3 "}flex flex-wrap items-center justify-between gap-2 px-1`}>
        <h2 id={heading} className="inline-flex items-center gap-1.5 text-xs font-black text-primary">
          <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />{title}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <a href={audience === "student" ? "/how-it-works" : fullHref} target={audience === "student" ? undefined : "_blank"}
            rel="noopener noreferrer" className="text-xs font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground">
            الدليل الكامل
          </a>
          <button type="button" onClick={() => setHidden(!hidden)}
            data-testid={audience === "student" ? (hidden ? "button-show-guide-film" : "button-hide-guide-film") : `button-toggle-${audience}-guide`}
            aria-expanded={!hidden}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-black text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {hidden ? <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
            {hidden ? "إظهار فيلم الاستخدام" : "إخفاء"}
          </button>
        </div>
      </div>
      {!hidden && <GuideFilm key={identity} compact film={film} muted displayName={displayName} title={title} />}
    </section>
  );
}
