import { useState, type FormEvent } from "react";
import { ChevronDown, Loader2, MessageSquare, Star } from "lucide-react";
import { useMyPlatformReviews, useSubmitReview } from "@/hooks/use-student";

const statuses = { pending: "بانتظار مراجعة الإدارة", approved: "معتمد للظهور في الصفحة الرئيسية", rejected: "لم يُعتمد للنشر" };
export default function PlatformReviewCard({ studentId }: { studentId: string | number }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const mine = useMyPlatformReviews(studentId);
  const submit = useSubmitReview();
  const latest = mine.data?.reviews[0];
  function send(event: FormEvent) {
    event.preventDefault(); setError(""); setSent(false);
    submit.mutate({ rating, text: text.trim(), publishConsent: consent }, {
      onSuccess: () => { setSent(true); setText(""); setRating(0); setConsent(false); },
      onError: (err) => setError(err instanceof Error ? err.message : "تعذر إرسال التقييم؛ أعد المحاولة."),
    });
  }
  return (
    <details id="platform-review" data-testid="student-platform-review" className="rounded-3xl border border-border bg-card text-foreground shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5 font-black [&::-webkit-details-marker]:hidden">
        <MessageSquare className="h-5 w-5 text-primary" /><span className="flex-1">قيّم المنصة</span>
        <span className="text-xs font-medium text-muted-foreground">شاركنا تجربتك</span><ChevronDown className="h-4 w-4" />
      </summary>
      <div className="space-y-4 border-t border-border p-5">
        <p className="text-sm leading-7 text-muted-foreground">يصل رأيك إلى الإدارة أولًا. لا يظهر في الصفحة الرئيسية إلا بعد اعتمادها.</p>
        {sent && <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm font-bold">تم إرسال تقييمك للإدارة بنجاح. تابع حالته أدناه.</p>}
        {mine.isError ? <button type="button" onClick={() => mine.refetch()} className="text-sm text-destructive underline">تعذر تحميل تقييماتك — إعادة المحاولة</button> : latest && (
          <div className="rounded-xl bg-muted/60 p-3 text-sm">
            <p className="font-bold">آخر تقييم: {latest.rating} / ٥ — {statuses[latest.status]}</p>
            <p className="mt-2 whitespace-pre-wrap leading-7">{latest.text}</p>
            {latest.adminReply && <p className="mt-2 border-r-2 border-primary pr-3">رد الإدارة: {latest.adminReply}</p>}
          </div>
        )}
        <form onSubmit={send} className="space-y-4">
          <fieldset disabled={submit.isPending}>
            <legend className="mb-2 text-sm font-bold">تقييمك من ٥</legend>
            <div className="flex gap-2" role="radiogroup" aria-label="تقييم المنصة">
              {[1, 2, 3, 4, 5].map(n => <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} من 5`} onClick={() => setRating(n)} className="rounded-lg p-2 text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <Star className={`h-7 w-7 ${n <= rating ? "fill-primary" : ""}`} />
              </button>)}
            </div>
          </fieldset>
          <label className="block text-sm font-bold">رأيك في تجربتك
            <textarea data-testid="input-platform-review-text" required maxLength={2000} value={text} onChange={e => setText(e.target.value)} disabled={submit.isPending} rows={4} placeholder="ما الذي أعجبك؟ وما الذي يحتاج تحسينًا؟" className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-normal leading-7 outline-none focus:border-primary" />
          </label>
          <p className="text-xs text-muted-foreground">{text.length} / ٢٠٠٠ حرف</p>
          <label className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
            <input type="checkbox" checked={consent} disabled={submit.isPending} onChange={e => setConsent(e.target.checked)} className="mt-1 accent-primary" />
            أوافق على نشر اسمي المسجل وتقييمي في الصفحة الرئيسية بعد موافقة الإدارة. لا يُنشر جوالي أو بريدي الإلكتروني.
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button data-testid="button-submit-platform-review" disabled={submit.isPending || !rating || !text.trim() || !consent} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />} إرسال التقييم للإدارة
          </button>
        </form>
      </div>
    </details>
  );
}
