import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type GeideaPaymentStatus = {
  paymentId: string;
  status: "session_created" | "pending" | "paid" | "failed" | "refund_pending" | "refund_failed" | "refunded";
  plan: string;
  amount: number;
  currency: string;
  invoiceNumber: string | null;
  providerOrderId: string | null;
  paidAt: string | null;
};

export default function GeideaPaymentReturnPage() {
  const search = useSearch();
  const paymentId = new URLSearchParams(search).get("paymentId") || "";
  const queryClient = useQueryClient();
  const paymentQuery = useQuery<GeideaPaymentStatus>({
    queryKey: ["/api/subscription/geidea/payments", paymentId],
    enabled: Boolean(paymentId),
    queryFn: async () => {
      const response = await fetch(
        `/api/subscription/geidea/payments/${encodeURIComponent(paymentId)}`,
        { credentials: "include" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "تعذر التحقق من الدفع");
      return result;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "paid" || status === "failed" || status === "refunded" ? false : 1800;
    },
    retry: 2,
  });

  useEffect(() => {
    if (paymentQuery.data?.status === "paid") {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/my-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
    }
  }, [paymentQuery.data?.status, queryClient]);

  const status = paymentQuery.data?.status;
  const isPaid = status === "paid";
  const isFailed = status === "failed";

  return (
    <main
      dir="rtl"
      className="flex min-h-[100dvh] items-center justify-center bg-[#F7F4EE] px-4 py-10 text-[#0D1B2A]"
    >
      <section className="w-full max-w-lg rounded-[2rem] border border-[#E5E7EB] bg-white p-7 text-center shadow-xl sm:p-10">
        {!paymentId ? (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <XCircle className="h-8 w-8" />
          </div>
        ) : isPaid ? (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
        ) : isFailed ? (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <XCircle className="h-8 w-8" />
          </div>
        ) : (
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F7F775]/40 text-[#0D1B2A]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#398B79]">
          قدراتك · الدفع عبر Geidea
        </p>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">
          {!paymentId
            ? "رابط العودة غير مكتمل"
            : isPaid
              ? "تم تأكيد الدفع"
              : isFailed
                ? "لم تكتمل عملية الدفع"
                : "نتحقق من عملية الدفع"}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[#64748B]">
          {!paymentId
            ? "لا يوجد رقم عملية يمكن التحقق منه."
            : isPaid
              ? "أكد خادم قدراتك نجاح العملية مباشرة من Geidea، وتم تفعيل اشتراكك."
              : isFailed
                ? "لم يؤكد Geidea نجاح العملية، لذلك لم يتم تفعيل الاشتراك."
                : paymentQuery.isError
                  ? "تعذر الوصول إلى حالة الدفع الآن. يمكنك إعادة المحاولة؛ لن يتم التفعيل دون تأكيد من Geidea."
                  : "قد يستغرق وصول التأكيد بضع ثوانٍ. لا تغلق الصفحة الآن."}
        </p>

        {paymentQuery.data && (
          <div className="mt-6 rounded-2xl bg-[#F7F4EE] p-4 text-right text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[#64748B]">الخطة</span>
              <span className="font-bold">{paymentQuery.data.plan}</span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span className="text-[#64748B]">المبلغ</span>
              <span className="font-bold">
                {Number(paymentQuery.data.amount).toLocaleString("ar-SA")} ر.س
              </span>
            </div>
            {isPaid && paymentQuery.data.invoiceNumber && (
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-[#64748B]">رقم الفاتورة</span>
                <span className="font-bold" dir="ltr">{paymentQuery.data.invoiceNumber}</span>
              </div>
            )}
          </div>
        )}

        {paymentQuery.isError && paymentId && !isPaid && !isFailed && (
          <Button
            type="button"
            variant="outline"
            onClick={() => paymentQuery.refetch()}
            className="mt-6 rounded-xl border-[#0D1B2A]"
          >
            <RefreshCw className="ml-2 h-4 w-4" />
            إعادة التحقق
          </Button>
        )}

        <Link
          href="/"
          className="mt-7 inline-flex rounded-xl bg-[#0D1B2A] px-5 py-3 text-sm font-black text-white transition hover:bg-[#1E2938]"
        >
          العودة إلى قدراتك
        </Link>
      </section>
    </main>
  );
}
