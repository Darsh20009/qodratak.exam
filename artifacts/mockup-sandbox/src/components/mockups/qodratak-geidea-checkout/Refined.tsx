import { useEffect, useState } from "react";
import "./_group.css";

export function Refined() {
  const [dark, setDark] = useState(true);
  const [plan, setPlan] = useState<"pro" | "plus">("pro");
  const [applePaySupported, setApplePaySupported] = useState(false);
  const [showCheckout, setShowCheckout] = useState(true);
  const price = plan === "pro" ? "٣٩" : "٦٩";
  const duration = plan === "pro" ? "٣ أشهر" : "٦ أشهر";

  useEffect(() => {
    const applePay = (window as any).ApplePaySession;
    if (typeof applePay?.canMakePayments === "function") {
      try { setApplePaySupported(Boolean(applePay.canMakePayments())); } catch { setApplePaySupported(false); }
    }
  }, []);

  const palette = dark
    ? { page: "#070f1b", card: "#111c2b", raised: "#172539", border: "#27364a", text: "#f7f8fc", muted: "#9ba9bb", subtle: "#718198" }
    : { page: "#f3f6fa", card: "#ffffff", raised: "#f6f8fb", border: "#dce3ec", text: "#12233a", muted: "#64748b", subtle: "#8998aa" };

  return (
    <main
      className="qodratak-checkout-demo flex min-h-screen items-end justify-center px-3 pt-3 pb-0 sm:items-center sm:px-8 sm:py-8"
      style={{ background: palette.page, color: palette.text, direction: "rtl" }}
    >
      <section
        className="mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border shadow-[0_30px_100px_rgba(0,0,0,.35)] sm:max-h-[860px] sm:rounded-[28px]"
        style={{ background: palette.card, borderColor: palette.border }}
      >
        <header className="relative shrink-0 overflow-hidden border-b px-5 py-5 sm:px-7" style={{ borderColor: palette.border }}>
          <div className="absolute -left-8 -top-12 h-36 w-36 rounded-full bg-[#ff8a70]/15 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff8a70] text-[#17202c]">
                <span className="text-xl font-black">ق</span>
              </div>
              <div>
                <p className="text-[11px] font-black tracking-wide text-[#ff8a70]">اشتراكك في قدراتك</p>
                <h1 className="mt-1 text-xl font-black sm:text-2xl">اختر باقتك وأكمل الدفع بأمان</h1>
                <p className="mt-1 text-xs" style={{ color: palette.muted }}>تجديدك يضيف المدة الجديدة بعد نهاية رصيدك الحالي.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDark(!dark)}
              className="shrink-0 rounded-full border px-3 py-2 text-xs font-bold"
              style={{ borderColor: palette.border, color: palette.muted }}
            >
              {dark ? "الوضع النهاري" : "الوضع الليلي"}
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <section className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="rounded-2xl border p-4" style={{ background: palette.raised, borderColor: palette.border }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold" style={{ color: palette.muted }}>اشتراكك الحالي</p>
                  <p className="mt-1 font-black">Pro · نشط</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">متبقي ٩٠ يومًا</span>
              </div>
              <p className="mt-2 text-xs" style={{ color: palette.muted }}>بعد الشراء، يستمر وصولك دون انقطاع وتضاف الباقة الجديدة إلى موعد الانتهاء.</p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 sm:min-w-44 sm:flex-col sm:items-start sm:justify-center" style={{ borderColor: palette.border, background: palette.card }}>
              <span className="text-xs font-bold" style={{ color: palette.muted }}>الانتهاء المتوقع</span>
              <span className="text-sm font-black">١٥ أبريل ٢٠٢٧</span>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-black">مدة الاشتراك</h2>
              <span className="text-[11px]" style={{ color: palette.subtle }}>السعر النهائي ظاهر قبل الدفع</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "pro" as const, name: "Pro", months: "٣ أشهر", amount: "٣٩" },
                { id: "plus" as const, name: "Pro Life Plus", months: "٦ أشهر", amount: "٦٩" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlan(item.id)}
                  className="rounded-2xl border p-4 text-right transition"
                  style={{
                    background: plan === item.id ? (dark ? "#1c2b3d" : "#fff7f4") : palette.raised,
                    borderColor: plan === item.id ? "#ff8a70" : palette.border,
                    boxShadow: plan === item.id ? "0 0 0 1px #ff8a70 inset" : "none",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black">{item.name}</span>
                    <span className="h-4 w-4 rounded-full border-2" style={{ borderColor: plan === item.id ? "#ff8a70" : palette.subtle, background: plan === item.id ? "#ff8a70" : "transparent" }} />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: palette.muted }}>وصول كامل لمدة {item.months}</p>
                  <p className="mt-3 text-2xl font-black">{item.amount}<small className="mr-1 text-xs font-bold" style={{ color: palette.muted }}>ر.س</small></p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border p-4" style={{ background: palette.raised, borderColor: palette.border }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black">وسيلة الدفع</h2>
                <p className="mt-1 text-xs" style={{ color: palette.muted }}>تُدخل بيانات البطاقة في صفحة Geidea الآمنة، ولا تحفظها قدراتك.</p>
              </div>
              <span className="rounded-xl bg-[#ff8a70]/15 px-3 py-2 text-xs font-black text-[#ff9b83]">بطاقة · مدى · Visa · Mastercard</span>
            </div>
            {applePaySupported && (
              <p className="mt-3 rounded-xl border border-[#ff8a70]/30 bg-[#ff8a70]/10 px-3 py-2 text-xs font-bold text-[#ffad9a]">
                جهازك يدعم Apple Pay؛ سيظهر الخيار داخل Geidea إذا كان مفعّلًا لحساب التاجر.
              </p>
            )}
          </section>

          {showCheckout ? (
            <section className="overflow-hidden rounded-2xl border" style={{ borderColor: palette.border }}>
              <div className="flex items-center justify-between border-b px-4 py-3" style={{ background: palette.card, borderColor: palette.border }}>
                <div>
                  <p className="text-sm font-black">إكمال الدفع لدى Geidea</p>
                  <p className="mt-1 text-[11px]" style={{ color: palette.muted }}>جلسة محمية · SAR · {price} ريال</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-500">اتصال آمن</span>
              </div>
              <div className="grid min-h-[210px] place-items-center bg-white p-5 text-center text-[#102033]">
                <div>
                  <div className="mx-auto mb-3 flex items-center justify-center gap-2 text-xs font-black">
                    <span className="rounded-lg border border-slate-200 px-3 py-2">مدى</span>
                    <span className="rounded-lg border border-slate-200 px-3 py-2 italic">VISA</span>
                    <span className="rounded-lg border border-slate-200 px-3 py-2">mastercard</span>
                    {applePaySupported && <span className="rounded-lg border border-slate-200 px-3 py-2">Apple Pay</span>}
                  </div>
                  <p className="text-sm font-black">نموذج الدفع المستضاف من Geidea</p>
                  <p className="mt-1 text-xs text-slate-500">تظهر وسائل الدفع التي يتيحها جهازك وحساب التاجر.</p>
                  <button className="mt-4 rounded-xl bg-[#102033] px-6 py-3 text-xs font-black text-white">تأكيد الدفع · {price} ريال</button>
                </div>
              </div>
            </section>
          ) : (
            <button onClick={() => setShowCheckout(true)} className="w-full rounded-2xl bg-[#ff8a70] p-4 font-black text-[#17202c]">
              اختر البطاقة لفتح الدفع الآمن
            </button>
          )}

          <div className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.border, background: palette.card }}>
            <div>
              <p className="text-xs font-bold" style={{ color: palette.muted }}>ملخص الطلب</p>
              <p className="mt-1 text-sm font-black">{plan === "pro" ? "Pro" : "Pro Life Plus"} · {duration}</p>
            </div>
            <p className="text-lg font-black text-[#ff8a70]">{price} ر.س</p>
          </div>

          <p className="text-center text-[11px] leading-5" style={{ color: palette.subtle }}>
            لا يتفعّل الاشتراك إلا بعد تأكيد Geidea من الخادم. تصلك الفاتورة في حسابك بعد نجاح الدفع.
          </p>
        </div>
      </section>
    </main>
  );
}
