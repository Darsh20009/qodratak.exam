import { useContext, useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { EyeOff, Maximize2, PlayCircle } from "lucide-react";
import { GuideFilm, guideFilmSrc } from "@/components/GuideFilm";
import { useUser } from "@/hooks/use-user";
import { StudentExamChromeContext } from "@/components/student/StudentExamChromeContext";
import { GUIDE_CHAPTER_LABELS, chapterForPath, readPageGuideHidden, shouldShowPageGuide, writePageGuideHidden, type GuideChapter } from "@/lib/guideChapters";

const store = () => { try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; } };

/** Route-aware page film. Never renders for guests, non-students, or while exam chrome is active. */
export function PageGuideFilm({ location, chapter: override }: { location: string; chapter?: GuideChapter }) {
  const { user } = useUser();
  const examChrome = useContext(StudentExamChromeContext);
  const chapter = override ?? chapterForPath(location);
  if (!shouldShowPageGuide({ chapter, role: (user as { role?: string } | null | undefined)?.role, studentId: user?.id, examActive: examChrome.isActive }) || !chapter) return null;
  const uid = String(user!.id);
  return <PageGuideFilmInner key={`${uid}:${chapter}`} chapter={chapter} uid={uid} />;
}

/** Lightweight guide-only wrapper for student pages that do not use StudentShell (no navbar). */
export function StudentPageGuide({ location, chapter, children }: { location: string; chapter?: GuideChapter; children: ReactNode }) {
  return (<><div dir="rtl" className="bg-background"><PageGuideFilm location={location} chapter={chapter} /></div>{children}</>);
}

function PageGuideFilmInner({ chapter, uid }: { chapter: GuideChapter; uid: string | null }) {
  const [hidden, setHiddenState] = useState(() => readPageGuideHidden(store(), uid, chapter));
  useEffect(() => { setHiddenState(readPageGuideHidden(store(), uid, chapter)); }, [uid, chapter]);
  const setHidden = (next: boolean) => { setHiddenState(next); writePageGuideHidden(store(), uid, chapter, next); };
  const label = GUIDE_CHAPTER_LABELS[chapter];

  if (hidden) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pt-3 sm:px-6" data-testid="page-guide-hidden">
        <button type="button" onClick={() => setHidden(false)} data-testid="button-show-page-guide"
          className="qodratak-focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-black text-foreground hover:border-primary/40">
          <PlayCircle className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          إظهار فيلم هذه الصفحة: {label.title}
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="page-guide-title" data-testid="section-page-guide-film" data-chapter={chapter}
      className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
      <div className="grid gap-4 rounded-3xl border border-border bg-card p-3 shadow-sm sm:p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:items-center lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="order-2 px-1 md:order-1">
          <p className="inline-flex items-center gap-1.5 text-xs font-black text-primary">
            <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" /> فيلم تعريفي بهذه الصفحة
          </p>
          <h2 id="page-guide-title" className="mt-2 text-lg font-black text-foreground sm:text-xl">{label.title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{label.caption} يبدأ بلا صوت، وفعّل الصوت من داخل الفيلم.</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href={guideFilmSrc({ chapter })} target="_blank" rel="noopener noreferrer" data-testid="link-page-guide-fullscreen"
              className="qodratak-focus-ring inline-flex items-center gap-1 rounded text-xs font-bold text-foreground underline underline-offset-4">
              <Maximize2 className="h-3 w-3" aria-hidden="true" /> ملء الشاشة
            </a>
            <Link href="/how-it-works" data-testid="link-how-it-works-page" className="text-xs font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground">دليل الصفحات</Link>
            <button type="button" onClick={() => setHidden(true)} data-testid="button-hide-page-guide"
              className="qodratak-focus-ring inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-black text-muted-foreground hover:bg-muted hover:text-foreground">
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> إخفاء في هذه الصفحة
            </button>
          </div>
        </div>
        <GuideFilm compact chapter={chapter} muted lazy={false} title={`فيلم تعريفي: ${label.title}`} className="order-1 md:order-2" />
      </div>
    </section>
  );
}
