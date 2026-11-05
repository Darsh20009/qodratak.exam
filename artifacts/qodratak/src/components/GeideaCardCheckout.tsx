import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Invoice } from "@/components/Invoice";
import {
  GEIDEA_RETURN_MESSAGE,
  type GeideaSession,
  formatArDate,
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

type Phase = "idle" | "creating" | "ready" | "error";

export default function GeideaCardCheckout({ planKey, planLabel, price, onActiveChange, onDone }: Props) {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<GeideaSession | null>(null);
  const [errorText, setErrorText] = useState("");
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const attempt = useRef(0); // invalidates late responses / callbacks
  const inFlight = useRef(false);
  const paymentWindowRef = useRef<Window | null>(null);
  const onActiveRef = useRef(onActiveChange);
  onActiveRef.current = onActiveChange;

  const payment = useGeideaPaymentStatus(checkoutOpened ? session?.paymentId : null);
  const status = payment.data?.status;
  const recheckRef = useRef(payment.recheck);
  recheckRef.current = payment.recheck;

  const active = phase === "creating" || Boolean(session);
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
    setCheckoutOpened(false);
  }, [planKey]);

  // Unmount: drop late results.
  useEffect(() => () => {
    attempt.current += 1;
    const pendingWindow = paymentWindowRef.current;
    paymentWindowRef.current = null;
    if (pendingWindow && !pendingWindow.closed) pendingWindow.close();
  }, []);

  const start = async () => {
    if (inFlight.current || session) return;
    inFlight.current = true;
    const myAttempt = ++attempt.current;
    // Reserve a top-level browser tab during the user's click. Navigating it
    // after session creation avoids popup blockers and removes the second step.
    const paymentWindow = window.open("about:blank", "_blank");
    paymentWindowRef.current = paymentWindow;
    if (paymentWindow) {
      try {
        paymentWindow.opener = null;
        paymentWindow.document.title = "الدفع الآمن | قدراتك";
        const body = paymentWindow.document.body;
        if (body) {
          body.dir = "rtl";
          body.style.cssText = "margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f8fa;color:#0d1b2a;font:700 16px system-ui,sans-serif";
          const message = paymentWindow.document.createElement("p");
          message.textContent = "جارٍ تجهيز صفحة الدفع الآمنة...";
          body.replaceChildren(message);
        }
      } catch {
        // Some browsers restrict access to a newly opened tab; navigation is
        // still attempted once the server returns the validated checkout URL.
      }
    }
    setPhase("creating");
    setErrorText("");
    try {
      const response = await apiRequest("POST", "/api/subscription/geidea/sessions", { planKey });
      const result = (await response.json()) as GeideaSession;
      if (myAttempt !== attempt.current) {
        if (paymentWindow && !paymentWindow.closed) paymentWindow.close();
        if (paymentWindowRef.current === paymentWindow) paymentWindowRef.current = null;
        return;
      }
      const checkoutUrl = safeGeideaUrl(result?.checkoutUrl);
      if (!result?.paymentId || !result?.sessionId || !checkoutUrl) {
        throw new Error("لم تصل بيانات صفحة الدفع الآمنة من Geidea.");
      }
      setSession({ ...result, checkoutUrl });
      setPhase("ready");
      setCheckoutOpened(true);
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.location.replace(checkoutUrl);
        if (paymentWindowRef.current === paymentWindow) paymentWindowRef.current = null;
      } else {
        paymentWindowRef.current = null;
        // If the browser blocks a new tab (common in installed web apps),
        // continue in the current top-level page instead of requiring another click.
        window.location.assign(checkoutUrl);
      }
    } catch (error) {
      try {
        if (paymentWindow && !paymentWindow.closed) paymentWindow.close();
      } catch {
        // Ignore browser restrictions while preserving the visible error.
      }
      if (paymentWindowRef.current === paymentWindow) paymentWindowRef.current = null;
      if (myAttempt !== attempt.current) return;
      setErrorText(readApiError(error, "تعذر بدء الدفع"));
      setPhase("error");
    } finally {
      if (myAttempt === attempt.current) inFlight.current = false;
    }
  };

  const terminal = Boolean(status && status !== "session_created" && status !== "pending");

  // Refresh immediately when the student returns from Geidea's separate browser page.
  useEffect(() => {
    if (!checkoutOpened || !session || terminal) return;
    const recheckWhenVisible = () => {
      if (document.visibilityState === "visible") recheckRef.current();
    };
    window.addEventListener("focus", recheckWhenVisible);
    document.addEventListener("visibilitychange", recheckWhenVisible);
    return () => {
      window.removeEventListener("focus", recheckWhenVisible);
      document.removeEventListener("visibilitychange", recheckWhenVisible);
    };
  }, [checkoutOpened, session, terminal]);

  // Same-origin return-page messages only trigger a server-side status check.
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
    setCheckoutOpened(false);
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
          لم يصل تأكيد يمكن الاعتماد عليه خلال عشر دقائق، فتوقفت المتابعة التلقائية هنا.
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
      <div className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
        <div className="flex items-start gap-3 bg-[#0D1B2A] p-4 text-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF8A70] text-[#0D1B2A]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-black">انتقال مباشر إلى صفحة الدفع الآمنة</p>
            <p className="mt-1 text-xs leading-6 text-white/70">
              ستفتح صفحة Geidea خارج التطبيق تلقائيًا بعد تجهيز العملية، وقد يظهر Apple Pay حسب جهازك وإعدادات التاجر.
            </p>
          </div>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2 text-[11px] font-bold text-muted-foreground">
            {["مدى", "Visa", "Mastercard", "Apple Pay"].map((method) => (
              <span key={method} className="rounded-full border border-border bg-background px-3 py-1.5">{method}</span>
            ))}
          </div>
          {phase === "error" && (
            <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs font-bold leading-6 text-red-600 dark:text-red-300">
              {errorText}
            </p>
          )}
        <Button
          type="button"
          onClick={start}
          disabled={phase === "creating" || !planKey}
          data-testid="button-geidea-prepare-checkout"
          className="mt-4 h-11 w-full rounded-xl bg-[#FF8A70] font-black text-[#17202C] hover:bg-[#ff9b83]"
        >
          {phase === "creating" ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CreditCard className="ml-2 h-4 w-4" />}
          {phase === "creating" ? "جارٍ فتح صفحة الدفع الآمنة..." : phase === "error" ? "إعادة المحاولة" : `ادفع الآن · ${price} ر.س`}
        </Button>
          <p className="mt-3 flex items-center justify-center gap-1 text-center text-[11px] font-medium leading-5 text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> لا يُفعّل الاشتراك إلا بعد تأكيد خادم قدراتك من Geidea.
          </p>
        </div>
      </div>
    );
  }

  const copy = statusCopy(status, payment.pollingExhausted);
  return (
    <div className="space-y-3" data-testid="geidea-top-level-checkout">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF8A70]/15 text-[#D65F48] dark:text-[#FF8A70]">
          <CreditCard className="h-5 w-5" />
      </div>
        <div className="min-w-0 flex-1">
          <p className="font-black">{checkoutOpened ? copy.title : "صفحة الدفع جاهزة"}</p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {checkoutOpened ? copy.body : `باقة ${planLabel} · ${price.toLocaleString("ar-SA")} ر.س`}
          </p>
        </div>
      </div>

      <a
        href={session.checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setCheckoutOpened(true)}
        data-testid="link-geidea-open-top-level"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF8A70] px-4 py-3 text-sm font-black text-[#17202C] transition hover:bg-[#ff9b83] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CreditCard className="h-4 w-4" />
        فتح صفحة الدفع الآمنة
        <ExternalLink className="h-4 w-4" />
      </a>

      {checkoutOpened && (
        <Button
          type="button"
          variant="outline"
          onClick={() => payment.recheck()}
          disabled={payment.isFetching}
          className="h-11 w-full rounded-xl border-border"
        >
          <RefreshCw className={`ml-2 h-4 w-4 ${payment.isFetching ? "animate-spin" : ""}`} />
          أتممت الدفع؟ تحقق من الحالة
        </Button>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-muted/70 p-3 text-[11px] font-medium leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
        Apple Pay يظهر فقط إذا كان متاحًا لجهازك ومفعّلًا لدى التاجر. التفعيل يعتمد على تأكيد Geidea من الخادم.
      </p>
    </div>
  );
}
