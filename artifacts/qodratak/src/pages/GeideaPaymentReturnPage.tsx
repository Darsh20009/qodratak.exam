import { useEffect } from "react";
import { Link, useSearch } from "wouter";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Invoice } from "@/components/Invoice";
import { GEIDEA_RETURN_MESSAGE, formatArDate, statusCopy, useGeideaPaymentStatus } from "@/lib/geidea";

export default function GeideaPaymentReturnPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const paymentId = params.get("paymentId") || "";
  const embedded = params.get("embedded") === "1";
  const paymentQuery = useGeideaPaymentStatus(paymentId);
  const status = paymentQuery.data?.status;
  const isPaid = status === "paid";
  const isBad = status === "failed" || status === "refunded" || status === "refund_failed" || status === "refund_pending";

  // Hint only: the parent polls the server itself.
  useEffect(() => {
    if (!embedded || !paymentId || window.parent === window) return;
    try {
      window.parent.postMessage({ type: GEIDEA_RETURN_MESSAGE, paymentId, status: status || null }, window.location.origin);
    } catch {
      // cross-origin parent: ignore
    }
  }, [embedded, paymentId, status]);

  const copy = !paymentId
    ? { title: "رابط العودة غير مكتمل", body: "لا يوجد رقم عملية يمكن التحقق منه." }
    : paymentQuery.isError && !status
      ? { title: "تعذر الوصول إلى حالة الدفع", body: "يمكنك إعادة المحاولة؛ لن يتم التفعيل دون تأكيد من Geidea." }
      : statusCopy(status, paymentQuery.pollingExhausted);

  return (
    <main dir="rtl" className={`flex min-h-[100dvh] items-center justify-center bg-[#F7F4EE] px-4 text-[#0D1B2A] ${embedded ? "py-4" : "py-10"}`}>
      <section className="w-full max-w-3xl space-y-5">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-[#E5E7EB] bg-white p-7 text-center shadow-xl sm:p-10">
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${isPaid ? "bg-emerald-50 text-emerald-700" : isBad || !paymentId ? "bg-red-50 text-red-600" : "bg-[#F7F775]/40"}`}>
            {isPaid ? <CheckCircle2 className="h-8 w-8" /> : isBad || !paymentId ? <XCircle className="h-8 w-8" /> : <Loader2 className="h-8 w-8 animate-spin" />}
          </div>
          <p className="text-xs font-black tracking-[0.16em] text-[#398B79]">قدراتك · الدفع بالبطاقة</p>
          <h1 className="mt-3 text-2xl font-black sm:text-3xl">{copy.title}</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[#64748B]">{copy.body}</p>

          {paymentQuery.data && (
            <div className="mt-6 space-y-2 rounded-2xl bg-[#F7F4EE] p-4 text-right text-sm">
              <div className="flex justify-between gap-4"><span className="text-[#64748B]">الخطة</span><span className="font-bold">{paymentQuery.data.plan}</span></div>
              <div className="flex justify-between gap-4"><span className="text-[#64748B]">المبلغ</span><span className="font-bold">{Number(paymentQuery.data.amount).toLocaleString("ar-SA")} ر.س</span></div>
              {isPaid && paymentQuery.data.endDate && (
                <div className="flex justify-between gap-4"><span className="text-[#64748B]">الاشتراك فعال حتى</span><span className="font-bold">{formatArDate(paymentQuery.data.endDate)}</span></div>
              )}
            </div>
          )}

          {paymentId && !isPaid && !isBad && (paymentQuery.isError || paymentQuery.pollingExhausted) && (
            <Button type="button" variant="outline" onClick={() => paymentQuery.recheck()} className="mt-6 rounded-xl border-[#0D1B2A]">
              <RefreshCw className="ml-2 h-4 w-4" /> إعادة التحقق
            </Button>
          )}

          {!embedded && (
            <div>
              <Link href="/" className="mt-7 inline-flex rounded-xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white transition hover:bg-[#1E2938]">
                العودة إلى قدراتك
              </Link>
            </div>
          )}
        </div>

        {isPaid && paymentQuery.data?.invoice && <Invoice {...paymentQuery.data.invoice} />}
      </section>
    </main>
  );
}
