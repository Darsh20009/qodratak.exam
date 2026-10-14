import { Loader2, MessageSquare, Star } from "lucide-react";
import { usePlatformReviews } from "@/hooks/use-student";

export default function ApprovedPlatformReviews() {
  const reviews = usePlatformReviews();
  return (
    <section id="student-reviews" data-testid="landing-approved-reviews" className="border-t border-border bg-card py-16 text-foreground" dir="rtl">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-sm font-bold text-primary">تجارب الطلاب</p>
        <h2 className="mt-2 text-3xl font-black">آراؤكم في قدراتك</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">تقييمات يرسلها الطلاب، وتظهر بعد مراجعة الإدارة واعتمادها.</p>
        {reviews.isLoading ? <div role="status" className="mt-6 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> تحميل التقييمات…</div>
          : reviews.isError ? <button onClick={() => reviews.refetch()} className="mt-6 text-sm underline">تعذر تحميل التقييمات — إعادة المحاولة</button>
          : reviews.data?.length ? <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.data.slice(0, 6).map(review => <article key={review._id} className="rounded-2xl border border-border bg-background p-6">
              <div className="flex items-center gap-3"><MessageSquare className="h-5 w-5 text-primary" /><h3 className="font-bold">{review.studentName}</h3></div>
              <div className="mt-3 flex gap-1 text-primary" aria-label={`${review.rating} من 5`}>
                {[1, 2, 3, 4, 5].map(n => <Star key={n} aria-hidden="true" className={`h-4 w-4 ${n <= review.rating ? "fill-primary" : "text-muted-foreground/30"}`} />)}
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-8 text-muted-foreground">{review.text}</p>
            </article>)}
          </div> : <p className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">ستظهر هنا تقييمات الطلاب بعد اعتمادها. لا نعرض تقييمات تجريبية أو غير مراجعة.</p>}
      </div>
    </section>
  );
}
