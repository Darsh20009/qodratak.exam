import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const GEIDEA_HOST = "www.ksamerchant.geidea.net";
export const GEIDEA_SCRIPT_URL = `https://${GEIDEA_HOST}/hpp/geideaCheckout.min.js`;
export const GEIDEA_RETURN_MESSAGE = "qodratak:geidea-return";

export type GeideaStatus =
  | "session_created"
  | "pending"
  | "paid"
  | "failed"
  | "refund_pending"
  | "refund_failed"
  | "refunded";

export type GeideaInvoice = {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  issueDate: string;
  startDate?: string;
  endDate?: string;
  status: "active";
  invoiceNumber: string;
};

export type GeideaPaymentStatus = {
  paymentId: string;
  status: GeideaStatus;
  plan: string;
  amount: number;
  currency: string;
  invoiceNumber: string | null;
  providerOrderId: string | null;
  paidAt: string | null;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
  invoice?: GeideaInvoice | null;
};

export type GeideaSession = { paymentId: string; sessionId: string; checkoutUrl: string };

/** Statuses after which polling must stop. refund_pending is not final but no longer "verifying". */
export const TERMINAL_STATUSES: GeideaStatus[] = ["paid", "failed", "refunded", "refund_failed", "refund_pending"];

const MAX_POLLS = 300; // Up to 10 minutes at 2s; the server settles sessions independently.
const POLL_MS = 2000;
const PROCESSING_WINDOW_MS = 10 * 60_000;

/** Only accept https URLs on the official Geidea KSA host. */
export function safeGeideaUrl(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname === GEIDEA_HOST ? url.toString() : null;
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    GeideaCheckout?: new (
      onSuccess: (data?: unknown) => void,
      onError: (data?: unknown) => void,
      onCancel: (data?: unknown) => void,
    ) => { startPayment: (sessionId: string, options: null, containerId: string) => void };
  }
}

let scriptPromise: Promise<void> | null = null;

/** Loads the Geidea SDK once; a failed load is forgotten so the next call retries. */
export function loadGeideaScript(): Promise<void> {
  if (window.GeideaCheckout) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    document.querySelectorAll(`script[data-geidea-sdk]`).forEach((node) => node.remove());
    const script = document.createElement("script");
    script.src = GEIDEA_SCRIPT_URL;
    script.async = true;
    script.dataset.geideaSdk = "1";
    const timer = window.setTimeout(() => fail(new Error("timeout")), 20000);
    function fail(err: Error) {
      window.clearTimeout(timer);
      scriptPromise = null;
      script.remove();
      reject(err);
    }
    script.onload = () => {
      window.clearTimeout(timer);
      if (window.GeideaCheckout) resolve();
      else fail(new Error("sdk-missing"));
    };
    script.onerror = () => fail(new Error("load-failed"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function readApiError(error: unknown, fallback: string) {
  let description = error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : fallback;
  try {
    const body = JSON.parse(description);
    if (typeof body?.error === "string") description = body.error;
    else if (typeof body?.message === "string") description = body.message;
  } catch {
    // plain text
  }
  return description || fallback;
}

export async function fetchGeideaPayment(paymentId: string): Promise<GeideaPaymentStatus> {
  const response = await fetch(`/api/subscription/geidea/payments/${encodeURIComponent(paymentId)}`, {
    credentials: "include",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error || "تعذر التحقق من الدفع");
  return result;
}

export const SUBSCRIPTION_QUERY_KEYS = [
  ["/api/user"],
  ["/api/user/my-subscriptions"],
  ["/api/subscription/status"],
  ["/api/wallet"],
  ["/api/user/current-subscription"],
];

/** Server-authoritative payment status with bounded polling. Never creates sessions. */
export function useGeideaPaymentStatus(paymentId: string | null | undefined) {
  const queryClient = useQueryClient();
  const polls = useRef(0);
  const [deadlineExpired, setDeadlineExpired] = useState(false);
  const invalidatedFor = useRef<string | null>(null);
  useEffect(() => {
    polls.current = 0;
    setDeadlineExpired(false);
    if (!paymentId) return;
    const timer = window.setTimeout(() => setDeadlineExpired(true), PROCESSING_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [paymentId]);

  const query = useQuery<GeideaPaymentStatus>({
    queryKey: ["/api/subscription/geidea/payments", paymentId],
    enabled: Boolean(paymentId),
    // Every request (success or failure) counts toward the cap.
    queryFn: () => {
      polls.current += 1;
      return fetchGeideaPayment(paymentId as string);
    },
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status && TERMINAL_STATUSES.includes(status)) return false;
      return deadlineExpired || polls.current >= MAX_POLLS ? false : POLL_MS;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    // Polling itself is the retry mechanism; no extra per-request retries.
    retry: false,
    staleTime: 0,
  });

  const status = query.data?.status;
  useEffect(() => {
    if (status === "paid" && paymentId && invalidatedFor.current !== paymentId) {
      invalidatedFor.current = paymentId;
      SUBSCRIPTION_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    }
  }, [status, paymentId, queryClient]);

  const pollingExhausted = (deadlineExpired || polls.current >= MAX_POLLS) && !(status && TERMINAL_STATUSES.includes(status));
  const recheck = () => {
    polls.current = 0;
    return query.refetch();
  };
  return { ...query, pollingExhausted, recheck };
}

export function formatArDate(value?: string | Date | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ar-SA-u-ca-gregory", {
    year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Riyadh",
  });
}

export function statusCopy(status?: GeideaStatus, exhausted = false) {
  switch (status) {
    case "paid":
      return { title: "تم تأكيد الدفع وتفعيل الاشتراك", body: "أكد خادم قدراتك نجاح العملية من Geidea. الفاتورة متاحة الآن، ويُرسل تأكيد الاشتراك عبر واتساب وفق إعدادات حسابك وقد يتأخر وصوله." };
    case "failed":
      return { title: "لم تكتمل عملية الدفع", body: "لم تؤكد Geidea نجاح العملية، ولم يتم تفعيل الاشتراك. إذا ظهر مبلغ معلّق لدى البنك، تواصل مع الدعم قبل تكرار الدفع." };
    case "refund_pending":
      return { title: "الاسترداد قيد المعالجة", body: "تم تسجيل طلب استرداد هذه العملية، وسيعود المبلغ إلى وسيلة الدفع بعد اكتمال المعالجة." };
    case "refund_failed":
      return { title: "تعذر إتمام الاسترداد", body: "لم يكتمل استرداد المبلغ تلقائيًا. تواصل مع الدعم وسنتابع العملية معك." };
    case "refunded":
      return { title: "تم استرداد المبلغ", body: "أعيد مبلغ هذه العملية، والاشتراك المرتبط بها غير مفعل." };
    default:
      return exhausted
        ? { title: "لم يصل التأكيد بعد", body: "لم نتمكن من حسم العملية خلال عشر دقائق. يمكنك إعادة التحقق دون إنشاء دفع جديد؛ وإذا ظهر خصم لدى البنك فتواصل مع الدعم." }
        : { title: "نتحقق من عملية الدفع", body: "قد تستغرق معالجة العملية حتى عشر دقائق. لا تكرر الدفع أثناء التحقق." };
  }
}
