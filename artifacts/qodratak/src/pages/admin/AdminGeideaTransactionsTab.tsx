import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type GeideaTransaction = {
  id: string;
  studentName: string;
  studentEmail: string | null;
  studentPhone: string | null;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  providerStatus: string | null;
  providerOrderId: string | null;
  merchantReferenceId: string | null;
  invoiceNumber: string;
  createdAt: string;
  paidAt: string | null;
  refundedAt: string | null;
  refundedAmount: number;
  refundReason: string | null;
};

type TransactionPage = {
  transactions: GeideaTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const STATUS_LABELS: Record<string, string> = {
  session_created: "بانتظار إتمام الدفع",
  pending: "قيد التحقق",
  paid: "مدفوع",
  failed: "فشل الدفع",
  refund_pending: "الاسترداد قيد المعالجة",
  refund_failed: "يتطلب التحقق من الاسترداد",
  refunded: "مسترد",
};

function dateLabel(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ar-SA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClass(status: string) {
  if (status === "paid") return "bg-emerald-500/15 text-emerald-300";
  if (status === "refunded" || status === "failed" || status === "refund_failed") return "bg-red-500/15 text-red-300";
  if (status === "refund_pending") return "bg-violet-500/15 text-violet-300";
  return "bg-amber-500/15 text-amber-300";
}

function verificationWarning(providerStatus: string | null) {
  if (!providerStatus?.startsWith("verification_mismatch:")) return null;
  const mismatches = new Set(providerStatus.slice("verification_mismatch:".length).split(","));
  const fields = [
    mismatches.has("amount") ? "المبلغ" : null,
    mismatches.has("currency") ? "العملة" : null,
  ].filter(Boolean);
  return `مراجعة مطلوبة: اختلاف ${fields.join(" و") || "بيانات العملية"}`;
}

export default function AdminGeideaTransactionsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState<GeideaTransaction | null>(null);
  const [reason, setReason] = useState("");
  const queryKey = ["/api/admin/geidea/transactions", page] as const;

  const transactionsQuery = useQuery<TransactionPage>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/admin/geidea/transactions?page=${page}&limit=25`, {
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "تعذر جلب العمليات");
      return result;
    },
  });

  const refundMutation = useMutation({
    mutationFn: async () => {
      if (!refundTarget) throw new Error("اختر عملية لاستردادها");
      const response = await fetch(`/api/admin/geidea/transactions/${refundTarget.id}/refund`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "تعذر استرداد العملية");
      return result;
    },
    onSuccess: () => {
      toast({ title: "تم تأكيد الاسترداد من Geidea" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/geidea/transactions"] });
      setRefundTarget(null);
      setReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "لم يتأكد الاسترداد",
        description: error.message,
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/geidea/transactions"] });
    },
  });

  const data = transactionsQuery.data;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">مدفوعات Geidea</h3>
          <p className="mt-1 text-sm text-slate-400">عمليات الاشتراك التجريبية وحالة الاسترداد.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => transactionsQuery.refetch()}
          disabled={transactionsQuery.isFetching}
          className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
        >
          <RefreshCw className={`ml-2 h-4 w-4 ${transactionsQuery.isFetching ? "animate-spin" : ""}`} />
          تحديث
        </Button>
      </div>

      {transactionsQuery.isError ? (
        <div className="rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-200">
          {(transactionsQuery.error as Error).message}
        </div>
      ) : transactionsQuery.isLoading ? (
        <div className="h-36 animate-pulse rounded-xl bg-slate-800" />
      ) : !data?.transactions.length ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 py-12 text-center text-sm text-slate-400">
          لا توجد عمليات Geidea حتى الآن.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[900px] text-right">
              <thead className="bg-slate-800/80 text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">الطالب / الفاتورة</th>
                  <th className="px-4 py-3 font-semibold">الخطة</th>
                  <th className="px-4 py-3 font-semibold">المبلغ</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">التاريخ</th>
                  <th className="px-4 py-3 font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.transactions.map((transaction) => (
                  <tr key={transaction.id} className="align-top transition hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{transaction.studentName}</p>
                      <p className="mt-1 font-mono text-xs text-slate-400" dir="ltr">{transaction.invoiceNumber}</p>
                      <p className="mt-1 text-xs text-slate-500">{transaction.studentEmail || transaction.studentPhone || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">{transaction.plan}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-white">
                      {Number(transaction.amount).toLocaleString("ar-SA")} ر.س
                      {transaction.refundedAmount > 0 && (
                        <p className="mt-1 text-xs font-normal text-red-300">
                          المسترد: {Number(transaction.refundedAmount).toLocaleString("ar-SA")} ر.س
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(transaction.status)}`}>
                        {STATUS_LABELS[transaction.status] || transaction.status}
                      </span>
                      {verificationWarning(transaction.providerStatus) && (
                        <p className="mt-1 max-w-48 text-xs font-semibold text-amber-300">
                          {verificationWarning(transaction.providerStatus)}
                        </p>
                      )}
                      {transaction.refundReason && (
                        <p className="mt-1 max-w-48 text-xs text-slate-500">{transaction.refundReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                      {dateLabel(transaction.paidAt || transaction.createdAt)}
                      {transaction.refundedAt && (
                        <p className="mt-1 text-red-300">استرداد: {dateLabel(transaction.refundedAt)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {transaction.status === "paid" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRefundTarget(transaction);
                            setReason("");
                          }}
                          className="border-red-900/70 text-red-300 hover:bg-red-950/50 hover:text-red-200"
                        >
                          استرداد كامل
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
            <span>{data.total.toLocaleString("ar-SA")} عملية</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="border-slate-700 bg-slate-800 text-slate-200"
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </Button>
              <span className="min-w-16 text-center">{page} / {Math.max(1, data.totalPages)}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page >= data.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="border-slate-700 bg-slate-800 text-slate-200"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={Boolean(refundTarget)}
        onOpenChange={(open) => {
          if (!open && !refundMutation.isPending) {
            setRefundTarget(null);
            setReason("");
          }
        }}
      >
        <DialogContent dir="rtl" className="border-slate-700 bg-slate-950 text-white sm:max-w-lg">
          <DialogHeader className="text-right">
            <DialogTitle>تأكيد استرداد كامل</DialogTitle>
            <DialogDescription className="text-slate-400">
              سيرسل هذا الإجراء طلب استرداد بقيمة {Number(refundTarget?.amount || 0).toLocaleString("ar-SA")} ر.س إلى Geidea.
              لا يمكن التراجع عن الاسترداد بعد تأكيده.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl border border-amber-900/60 bg-amber-950/30 p-3 text-xs leading-5 text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              لن يتغير السجل إلى «مسترد» إلا بعد أن تؤكد Geidea نجاح العملية.
            </div>
            <label className="block text-sm font-semibold" htmlFor="geidea-refund-reason">سبب الاسترداد</label>
            <Textarea
              id="geidea-refund-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={300}
              placeholder="اكتب سببًا واضحًا لتوثيق الاسترداد"
              className="min-h-24 border-slate-700 bg-slate-900 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="flex justify-start gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefundTarget(null)}
              disabled={refundMutation.isPending}
              className="border-slate-700 text-slate-200"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={() => refundMutation.mutate()}
              disabled={reason.trim().length < 3 || refundMutation.isPending}
              className="bg-red-700 text-white hover:bg-red-600"
            >
              {refundMutation.isPending ? "جارٍ طلب الاسترداد..." : "تأكيد الاسترداد"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
