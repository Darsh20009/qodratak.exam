import { Loader2, MessageSquare, Star } from "lucide-react";
import { usePlatformReviews } from "@/hooks/use-student";

export default function ApprovedPlatformReviews() {
  const reviews = usePlatformReviews();
  const loopReviews = reviews.data?.length
    ? Array.from(
        { length: Math.max(1, Math.ceil(4 / reviews.data.length)) },
        () => reviews.data!,
      ).flat()
    : [];

  return (
    <section id="student-reviews" data-testid="landing-approved-reviews" className="border-t border-border bg-card py-16 text-foreground" dir="rtl">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-sm font-bold text-primary">تجارب الطلاب</p>
        <h2 className="mt-2 text-3xl font-black">آراؤكم في قدراتك</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">تقييمات يرسلها الطلاب، وتظهر بعد مراجعة الإدارة واعتمادها.</p>
        {reviews.isLoading ? <div role="status" className="mt-6 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> تحميل التقييمات…</div>
          : reviews.isError ? <button onClick={() => reviews.refetch()} className="mt-6 text-sm underline">تعذر تحميل التقييمات — إعادة المحاولة</button>
          : loopReviews.length ? <div
            className="approved-reviews-viewport mt-8 overflow-hidden py-2"
            role="region"
            aria-label="تقييمات الطلاب المتحركة"
            aria-live="off"
            tabIndex={0}
          >
            <div
              className="approved-reviews-marquee flex w-max"
              dir="ltr"
              style={{ "--approved-reviews-duration": `${Math.max(32, loopReviews.length * 8)}s` } as React.CSSProperties}
            >
              {[0, 1].map(copy => (
                <div
                  key={copy}
                  className="flex shrink-0 gap-4 pr-4"
                  role={copy === 0 ? "list" : undefined}
                  aria-label={copy === 0 ? "تقييمات الطلاب" : undefined}
                  aria-hidden={copy === 1 ? true : undefined}
                >
                  {loopReviews.map((review, index) => <article
                    key={`${copy}-${review._id}-${index}`}
                    role={copy === 0 ? "listitem" : undefined}
                    dir="rtl"
                    className="flex h-48 w-[min(78vw,18rem)] flex-none flex-col rounded-2xl border border-border bg-background p-4 sm:w-80 sm:p-5"
                  >
                    <div className="flex items-center gap-3"><MessageSquare className="h-5 w-5 shrink-0 text-primary" /><h3 className="truncate font-bold">{review.studentName}</h3></div>
                    <div className="mt-3 flex gap-1 text-primary" aria-label={`${review.rating} من 5`}>
                      {[1, 2, 3, 4, 5].map(n => <Star key={n} aria-hidden="true" className={`h-4 w-4 ${n <= review.rating ? "fill-primary" : "text-muted-foreground/30"}`} />)}
                    </div>
                    <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{review.text}</p>
                    </div>
                  </article>)}
                </div>
              ))}
            </div>
          </div> : <p className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">ستظهر هنا تقييمات الطلاب بعد اعتمادها. لا نعرض تقييمات تجريبية أو غير مراجعة.</p>}
      </div>
    </section>
  );
}
