import { useEffect, useId, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Invoice } from "@/components/Invoice";
import {
  GEIDEA_RETURN_MESSAGE,
  type GeideaSession,
  formatArDate,
  loadGeideaScript,
  readApiError,
  safeGeideaUrl,
  statusCopy,
  useGeideaPaymentStatus,
} from "@/lib/geidea";

type Props = {
  planKey: string;
  planLabel: string;
  price: number;
  onActiveChange?: (active: boolean) => void;
  onDone?: () => void;
};

type Phase = "idle" | "creating" | "embedding" | "embedded" | "sdk_error" | "error";

export default function GeideaCardCheckout({ planKey, planLabel, price, onActiveChange, onDone }: Props) {
  const queryClient = useQueryClient();
  const containerId = `geidea-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<GeideaSession | null>(null);
  const [errorText, setErrorText] = useState("");
  const [userClosed, setUserClosed] = useState(false);
  const [embedRetry, setEmbedRetry] = useState(0);
  const [applePaySupported, setApplePaySupported] = useState(false);
  const attempt = useRef(0); // invalidates late responses / callbacks
  const inFlight = useRef(false);
  const onActiveRef = useRef(onActiveChange);
  onActiveRef.current = onActiveChange;

  useEffect(() => {
    const ApplePay = (window as any).ApplePaySession;
    if (typeof ApplePay?.canMakePayments !== "function") return;
    try {
      setApplePaySupported(Boolean(ApplePay.canMakePayments()));
    } catch {
      setApplePaySupported(false);
    }
  }, []);

  const payment = useGeideaPaymentStatus(session?.paymentId);
  const status = payment.data?.status;
  const recheckRef = useRef(payment.recheck);
  recheckRef.current = payment.recheck;

  const active = phase !== "idle" || Boolean(session);
  useEffect(() => {
    onActiveRef.current?.(active);
  }, [active]);

  // Reset when the plan changes underneath an unpaid checkout.
  useEffect(() => {
    attempt.current += 1;
    inFlight.current = false;
    setSession(null);
    setPhase("idle");
    setErrorText("");
  }, [planKey]);

  // Unmount: drop late results.
  useEffect(() => () => {
    attempt.current += 1;
  }, []);

  const start = async () => {
    if (inFlight.current || session) return;
    inFlight.current = true;
    const myAttempt = ++attempt.current;
    setPhase("creating");
    setErrorText("");
    setUserClosed(false);
    try {
      const response = await apiRequest("POST", "/api/subscription/geidea/sessions", { planKey });
      const result = (await response.json()) as GeideaSession;
      if (myAttempt !== attempt.current) return;
      if (!result?.paymentId || !result?.sessionId) throw new Error("لم تصل بيانات جلسة الدفع من Geidea.");
      setSession({ ...result, checkoutUrl: safeGeideaUrl(result.checkoutUrl) || "" });
      setEmbedRetry(0);
      setPhase("embedding");
    } catch (error) {
      if (myAttempt !== attempt.current) return;
      setErrorText(readApiError(error, "تعذر بدء الدفع"));
      setPhase("error");
    } finally {
      if (myAttempt === attempt.current) inFlight.current = false;
    }
  };

  const terminal = Boolean(status && status !== "session_created" && status !== "pending");

  // Mount the SDK once per session / explicit retry. Display phase is NOT a dependency,
  // so updating it never tears down the iframe. Cleared on session change, plan reset,
  // explicit retry, terminal status, or unmount.
  useEffect(() => {
    if (!session || terminal) return;
    const myAttempt = attempt.current;
    let disposed = false;
    const live = () => !disposed && myAttempt === attempt.current;
    setPhase("embedding");

    // The SDK refuses window !== top (checkWindowPosition). In nested contexts
    // (e.g. preview iframes) embed the official hosted checkout directly.
    let nested = true;
    try {
      nested = window.self !== window.top;
    } catch {
      nested = true;
    }
    if (nested) {
      const hosted = safeGeideaUrl(session.checkoutUrl);
      const container = document.getElementById(containerId);
      if (!hosted || !container) {
        setPhase("sdk_error");
        return () => {
          disposed = true;
        };
      }
      const url = new URL(hosted);
      url.searchParams.set("parentOrigin", window.location.origin);
      const providerOrigin = url.origin;
      const frame = document.createElement("iframe");
      frame.src = url.toString();
      frame.title = "نموذج الدفع الآمن من Geidea";
      frame.allow = "payment *";
      frame.style.width = "100%";
      frame.style.minHeight = "650px";
      frame.style.border = "0";
      frame.onload = () => {
        if (live()) setPhase("embedded");
      };
      container.innerHTML = "";
      container.appendChild(frame);
      // Provider messages are hints only: exact origin + our live iframe, then recheck.
      const onMessage = (event: MessageEvent) => {
        if (!live()) return;
        if (event.origin !== providerOrigin || event.source !== frame.contentWindow) return;
        recheckRef.current();
      };
      window.addEventListener("message", onMessage);
      return () => {
        disposed = true;
        window.removeEventListener("message", onMessage);
        frame.onload = null;
        frame.remove();
      };
    }

    loadGeideaScript()
      .then(() => {
        if (!live() || !window.GeideaCheckout) return;
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";
        // Callbacks are UX hints only; the server decides payment state.
        // They stay valid until this effect's cleanup runs.
        const checkout = new window.GeideaCheckout(
          () => { if (live()) recheckRef.current(); },
          () => { if (live()) recheckRef.current(); },
          () => {
            if (!live()) return;
            setUserClosed(true);
            recheckRef.current();
          },
        );
        checkout.startPayment(session.sessionId, null, containerId);
        setPhase("embedded");
      })
      .catch(() => {
        if (live()) setPhase("sdk_error");
      });
    return () => {
      // The public SDK exposes no teardown API; removing its iframe and gating
      // callbacks via live() prevents late updates from abandoned instances.
      disposed = true;
      const container = document.getElementById(containerId);
      if (container) container.innerHTML = "";
    };
  }, [session, embedRetry, terminal, containerId]);

  // Same-origin hint from the return page loaded inside the iframe.
  useEffect(() => {
    if (!session) return;
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== GEIDEA_RETURN_MESSAGE || event.data?.paymentId !== session.paymentId) return;
      recheckRef.current();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [session]);

  const reset = () => {
    attempt.current += 1;
    inFlight.current = false;
    setSession(null);
    setPhase("idle");
    setErrorText("");
    setUserClosed(false);
    queryClient.removeQueries({ queryKey: ["/api/subscription/geidea/payments", session?.paymentId] });
  };

  if (status === "paid" && payment.data) {
    const data = payment.data;
    return (
      <div className="space-y-3">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-black">
            <CheckCircle2 className="h-5 w-5" /> {statusCopy("paid").title}
          </div>
          <p className="mt-1 text-xs font-bold leading-6">
            اشتراكك فعال حتى {formatArDate(data.endDate || data.invoice?.endDate)}. {statusCopy("paid").body}
          </p>
        </div>
        {data.invoice ? (
          <div className="overflow-hidden rounded-2xl">
            <Invoice {...data.invoice} />
          </div>
        ) : (
          <p className="rounded-xl bg-muted p-3 text-xs font-bold text-muted-foreground">جارٍ تجهيز الفاتورة، ستجدها في صفحة اشتراكاتك.</p>
        )}
        <Button type="button" onClick={onDone} className="h-11 w-full rounded-xl bg-[#FF8A70] font-black text-[#17202C] hover:bg-[#ff9b83]">
          تم
        </Button>
      </div>
    );
  }

  if (payment.pollingExhausted) {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 text-foreground">
        <h3 className="font-black">انتهت مهلة انتظار تأكيد الدفع</h3>
        <p className="text-sm leading-7 text-muted-foreground">
          لم يصل تأكيد يمكن الاعتماد عليه خلال عشر دقائق، فتوقف نموذج الدفع هنا.
          إذا ظهر خصم في البنك فلا تكرر الدفع؛ سيواصل الخادم التحقق من أي تأكيد متأخر،
          ويمكنك متابعة العملية من حسابك أو التواصل مع الدعم.
        </p>
        <Button type="button" variant="outline" onClick={() => payment.recheck()}>
          إعادة التحقق دون دفع جديد
        </Button>
      </div>
    );
  }

  if (status && status !== "session_created" && status !== "pending") {
    const copy = statusCopy(status);
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
        <div className="flex items-center gap-2 font-black text-red-600">
          <XCircle className="h-5 w-5" /> {copy.title}
        </div>
        <p className="mt-1 text-xs font-bold leading-6 text-muted-foreground">{copy.body}</p>
        {status === "failed" && (
          <Button type="button" onClick={reset} className="mt-3 h-11 w-full rounded-xl bg-[#FF8A70] font-black text-[#17202C] hover:bg-[#ff9b83]">
            المحاولة بعملية جديدة
          </Button>
        )}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
        <p className="text-sm font-bold leading-6">أكمل الدفع داخل نموذج Geidea الآمن: مدى، Visa، Mastercard، وأي وسيلة تظهر لحسابك وجهازك.</p>
        {applePaySupported && (
          <p className="mt-2 rounded-xl border border-[#FF8A70]/30 bg-[#FF8A70]/10 px-3 py-2 text-xs font-bold text-foreground">
            جهازك يدعم Apple Pay؛ سيظهر الخيار داخل Geidea إذا كان مفعّلًا لحساب التاجر.
          </p>
        )}
        {phase === "error" && <p className="mt-2 text-xs font-bold text-red-500">{errorText}</p>}
        <Button
          type="button"
          onClick={start}
          disabled={phase === "creating" || !planKey}
          className="mt-4 h-11 w-full rounded-xl bg-[#FF8A70] font-black text-[#17202C] hover:bg-[#ff9b83]"
        >
          {phase === "creating" ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CreditCard className="ml-2 h-4 w-4" />}
          {phase === "creating" ? "جارٍ تجهيز الدفع..." : phase === "error" ? "إعادة المحاولة" : `ادفع ${price} ريال بالبطاقة`}
        </Button>
        <p className="mt-3 flex items-center justify-center gap-1 text-center text-[11px] font-medium text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> لا يتم التفعيل إلا بعد تأكيد خادم قدراتك من Geidea.
        </p>
      </div>
    );
  }

  const copy = statusCopy(status, payment.pollingExhausted);
  return (
    <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-card-foreground">
        <span>{planLabel} · {price} ريال</span>
          <button type="button" onClick={reset} className="text-muted-foreground underline underline-offset-4">
          إلغاء وتغيير الباقة
        </button>
      </div>

      {phase === "embedding" && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-xs font-bold text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ تحميل نموذج الدفع...
        </div>
      )}
      {phase === "sdk_error" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
          تعذر تحميل نموذج الدفع داخل الصفحة.
          <button type="button" onClick={() => setEmbedRetry((n) => n + 1)} className="mr-2 underline underline-offset-4">
            إعادة التحميل
          </button>
        </div>
      )}
      <div
        id={containerId}
        className={`w-full overflow-hidden rounded-2xl bg-white [&_iframe]:!w-full [&_iframe]:min-h-[520px] ${phase === "sdk_error" ? "hidden" : "min-h-[520px]"}`}
      />

      <div className="rounded-xl border border-border bg-card p-3 text-xs font-bold leading-6 text-muted-foreground">
        <p className="text-foreground">{userClosed ? "أغلقت نموذج الدفع" : copy.title}</p>
        <p>{userClosed ? "إن لم تكمل الدفع فلن يتم الخصم. يمكنك إلغاء العملية أو إعادة التحقق." : copy.body}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <button type="button" onClick={() => payment.recheck()} className="inline-flex items-center gap-1 underline underline-offset-4">
            <RefreshCw className={`h-3.5 w-3.5 ${payment.isFetching ? "animate-spin" : ""}`} /> إعادة التحقق
          </button>
          {session.checkoutUrl && (
            <a href={session.checkoutUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
              فتح صفحة الدفع الآمنة <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">استخدم الرابط إذا لم يعمل التحقق الثلاثي داخل النافذة.</p>
      </div>
    </div>
  );
}
