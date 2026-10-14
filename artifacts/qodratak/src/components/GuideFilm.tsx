import { PlayCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { guideFilmSrc, isGuideReadyMessage, normalizeGuideDisplayName, type GuideFilmOptions } from "@/lib/guideViewer";
export { guideFilmSrc } from "@/lib/guideViewer";

const GUIDE_BASE = "/qodratak-guide/";

export type { GuideFilmOptions } from "@/lib/guideViewer";

export function GuideFilm({
  className = "", compact = false, film, chapter, muted, title, lazy = true, displayName,
}: { className?: string; compact?: boolean; title?: string; lazy?: boolean; displayName?: string } & GuideFilmOptions) {
  const src = guideFilmSrc({ film, chapter, muted });
  const fullSrc = guideFilmSrc({ film, chapter });
  const frame = useRef<HTMLIFrameElement>(null);
  const viewerName = normalizeGuideDisplayName(displayName);
  const sendViewer = () => frame.current?.contentWindow?.postMessage(
    { type: "qodratak.guide.viewer", displayName: viewerName }, window.location.origin,
  );
  useEffect(() => {
    const ready = (event: MessageEvent) => {
      if (isGuideReadyMessage(event.origin, window.location.origin, event.source, frame.current?.contentWindow, event.data)) sendViewer();
    };
    window.addEventListener("message", ready);
    sendViewer();
    return () => window.removeEventListener("message", ready);
  }, [src, viewerName]);
  return (
    <figure className={`relative ${className}`} data-testid="guide-film">
      <div className="relative overflow-hidden rounded-[22px] border border-[#24202D]/10 bg-[#0D1B2A] p-1.5 shadow-[0_24px_70px_rgba(13,27,42,.22)] dark:border-white/10">
        <div className="relative aspect-video w-full overflow-hidden rounded-[16px] bg-[#0D1B2A]">
          <iframe
            ref={frame}
            src={src}
            onLoad={sendViewer}
            title={title ?? "فيلم تعريفي: كيف تستخدم منصة قدراتك خطوة بخطوة"}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
            loading={lazy ? "lazy" : "eager"}
            data-testid="iframe-guide-film"
          />
        </div>
      </div>
      {!compact && (
        <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-bold text-[#6B625B] dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <PlayCircle className="h-3.5 w-3.5 text-[#FF8A70]" aria-hidden="true" />
            جولة قصيرة داخل صفحات المنصة
          </span>
          <a href={fullSrc} target="_blank" rel="noopener noreferrer" className="qodratak-focus-ring rounded underline underline-offset-4 hover:text-[#171723] dark:hover:text-white" data-testid="link-guide-fullscreen">
            افتح بملء الشاشة
          </a>
        </figcaption>
      )}
    </figure>
  );
}

export function GuideFilmCard() {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" data-testid="card-guide-film">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-black text-[#398B79]">
            <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" /> دليل الاستخدام
          </p>
          <h2 className="mt-2 text-lg font-black text-foreground">كيف تستخدم قدراتك؟</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            فيلم قصير يمر بك على صفحات المنصة: من أين تبدأ، وأين تتدرب، وكيف تراجع نتيجتك. شغّله وتحكم بالصوت والإيقاف من داخل الفيلم.
          </p>
          <a href={GUIDE_BASE} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-black text-primary-foreground hover:bg-primary/90" data-testid="link-guide-open">
            شاهد بملء الشاشة
          </a>
        </div>
        <GuideFilm compact />
      </div>
    </section>
  );
}
