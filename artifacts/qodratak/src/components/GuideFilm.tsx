import { PlayCircle } from "lucide-react";

const GUIDE_SRC = "/qodratak-guide/";

export function GuideFilm({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <figure className={`relative ${className}`} data-testid="guide-film">
      <div className="relative overflow-hidden rounded-[22px] border border-[#24202D]/10 bg-[#0D1B2A] p-1.5 shadow-[0_24px_70px_rgba(13,27,42,.22)] dark:border-white/10">
        <div className="relative aspect-video w-full overflow-hidden rounded-[16px] bg-[#0D1B2A]">
          <iframe
            src={GUIDE_SRC}
            title="فيلم تعريفي: كيف تستخدم منصة قدراتك خطوة بخطوة"
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
            loading="lazy"
            data-testid="iframe-guide-film"
          />
        </div>
      </div>
      {!compact && (
        <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-bold text-[#6B625B] dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <PlayCircle className="h-4 w-4 text-[#FF8A70]" />
            جولة في المنصة خلال ٤٦ ثانية
          </span>
          <a
            href={GUIDE_SRC}
            target="_blank"
            rel="noopener noreferrer"
            className="qodratak-focus-ring rounded underline underline-offset-4 hover:text-[#171723] dark:hover:text-white"
            data-testid="link-guide-fullscreen"
          >
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
            <PlayCircle className="h-4 w-4" /> دليل الاستخدام
          </p>
          <h2 className="mt-2 text-lg font-black text-foreground">كيف تستخدم قدراتك؟</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            فيلم قصير يمر بك على صفحات المنصة: من أين تبدأ، وأين تتدرب، وكيف تراجع نتيجتك. شغّله وتحكم بالصوت والإيقاف من داخل الفيلم.
          </p>
          <a
            href="/qodratak-guide/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-black text-primary-foreground hover:bg-primary/90"
            data-testid="link-guide-open"
          >
            شاهد بملء الشاشة
          </a>
        </div>
        <GuideFilm compact />
      </div>
    </section>
  );
}
