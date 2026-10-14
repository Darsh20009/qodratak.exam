import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CreditCard, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatArDate } from "@/lib/geidea";

type Payment = {
  _id: string;
  type: string;
  price: number;
  currency?: string;
  paymentGateway?: string;
  paymentStatus?: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  endDate?: string;
  invoiceNumber?: string;
};

function paymentLabel(payment: Payment) {
  if (payment.paymentGateway === "geidea") {
    if (payment.paymentStatus === "paid") return "تم الدفع وتفعيل الاشتراك";
    if (["refund_pending", "refunded", "refund_failed"].includes(payment.paymentStatus || "")) return "عملية استرداد";
    if (payment.status === "cancelled" || payment.paymentStatus === "failed") return "لم تكتمل العملية";
    return "قيد معالجة الدفع";
  }
  return payment.status === "active" ? "اشتراك فعّال" : payment.status === "pending" ? "بانتظار المراجعة" : "منتهٍ";
}

export default function PaymentHistory({ studentId }: { studentId: string }) {
  const history = useQuery<Payment[]>({
    queryKey: ["/api/user/my-subscriptions", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const response = await fetch("/api/user/my-subscriptions", { credentials: "include" });
      if (!response.ok) throw new Error("تعذر تحميل العمليات");
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error("تعذر قراءة العمليات");
      return data as Payment[];
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  return (
    <section aria-labelledby="payment-history-heading" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6" dir="rtl">
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 id="payment-history-heading" className="text-lg font-black text-foreground">عملياتي وفواتيري</h2>
      </div>
      {history.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">جارٍ تحميل العمليات...</p>
      ) : history.isError ? (
        <div className="mt-4 text-sm text-destructive">
          تعذر تحميل العمليات.
          <Button type="button" variant="link" onClick={() => history.refetch()} className="gap-1 text-inherit">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> إعادة المحاولة
          </Button>
        </div>
      ) : !history.data?.length ? (
        <p className="mt-4 text-sm text-muted-foreground">لم تسجّل أي عملية اشتراك بعد. ستظهر محاولات الدفع واشتراكاتك هنا.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {history.data.map((payment) => (
            <li key={payment._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
              <div className="space-y-1">
                <p className="font-bold text-foreground">{payment.type} · {Number(payment.price || 0).toLocaleString("ar-SA")} ر.س</p>
                <p className="text-sm text-muted-foreground">{formatArDate(payment.paidAt || payment.createdAt)} · {paymentLabel(payment)}</p>
                {payment.paymentGateway === "geidea" && payment.paymentStatus === "paid" && payment.endDate && (
                  <p className="text-xs text-muted-foreground">الاشتراك حتى {formatArDate(payment.endDate)}</p>
                )}
              </div>
              {payment.paymentGateway === "geidea" && payment.paymentStatus === "paid" ? (
                <Link href={`/payment/geidea/return?paymentId=${encodeURIComponent(payment._id)}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/30 px-3 text-sm font-bold text-primary hover:bg-primary/5">
                  <FileText className="h-4 w-4" aria-hidden="true" /> عرض الفاتورة {payment.invoiceNumber}
                </Link>
              ) : payment.paymentGateway === "geidea" && payment.status === "pending" ? (
                <Link href={`/payment/geidea/return?paymentId=${encodeURIComponent(payment._id)}`}
                  className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-sm font-bold text-foreground hover:bg-muted">
                  متابعة حالة الدفع
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
