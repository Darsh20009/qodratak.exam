import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { FileText, Loader2, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Invoice } from "@/components/Invoice";
import type { GeideaInvoice } from "@/lib/geidea";

async function fetchSharedInvoice(paymentId: string, accessToken: string): Promise<GeideaInvoice> {
  const response = await fetch(`/api/payments/geidea/invoices/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body?.invoice) {
    throw new Error(typeof body?.error === "string" ? body.error : "رابط الفاتورة غير صالح أو منتهي.");
  }
  return body.invoice as GeideaInvoice;
}

export default function GeideaInvoicePage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const paymentId = params.get("paymentId") || "";
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    setAccessToken(fragment.get("access") || "");
  }, []);

  const invoiceQuery = useQuery({
    queryKey: ["shared-geidea-invoice", paymentId, Boolean(accessToken)],
    queryFn: () => fetchSharedInvoice(paymentId, accessToken),
    enabled: Boolean(paymentId && accessToken),
    retry: false,
    staleTime: Infinity,
  });

  return (
    <main dir="rtl" className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-4 py-8 text-foreground">
      {!paymentId || (!accessToken && !invoiceQuery.isLoading) ? (
        <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-black">رابط الفاتورة غير مكتمل</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">افتح الرابط كاملًا من رسالة واتساب التي وصلتك بعد الدفع.</p>
        </section>
      ) : invoiceQuery.isPending ? (
        <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-black">جارٍ تحميل الفاتورة</h1>
          <p className="mt-2 text-sm text-muted-foreground">نتحقق من الفاتورة المدفوعة بأمان.</p>
        </section>
      ) : invoiceQuery.isError ? (
        <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-black">تعذر فتح الفاتورة</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{(invoiceQuery.error as Error).message}</p>
        </section>
      ) : invoiceQuery.data ? (
        <section className="w-full max-w-3xl space-y-3">
          <p className="text-center text-xs font-bold text-muted-foreground">فاتورة قدراتك · نسخة آمنة للعرض والطباعة</p>
          <Invoice {...invoiceQuery.data} />
        </section>
      ) : null}
    </main>
  );
}
