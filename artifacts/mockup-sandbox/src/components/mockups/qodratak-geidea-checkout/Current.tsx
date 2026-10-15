import "./_group.css";

export function Current() {
  return (
    <main className="qodratak-checkout-demo min-h-screen bg-[#07111f] p-4 text-[#0d1b2a] sm:p-10">
      <section className="mx-auto max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-auto rounded-[28px] border border-[#e5e7eb] bg-[#f7f4ee] shadow-2xl sm:max-h-[850px]">
        <header className="relative bg-[#0d1b2a] px-6 py-6 text-white">
          <div className="absolute -left-10 -top-12 h-32 w-32 rounded-full bg-[#f7f775]/15 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f7f775] text-xl">♕</div>
            <div>
              <h1 className="text-xl font-black">اشتراكي</h1>
              <p className="mt-1 text-xs text-white/65">اشتراكك الحالي وباقة واحدة واضحة</p>
            </div>
          </div>
        </header>

        <div className="space-y-4 p-5">
          <section className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
            <p className="text-xs font-bold text-[#94a3b8]">اشتراكك الحالي</p>
            <div className="mt-2 flex items-center justify-between">
              <strong>Pro</strong>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">نشط</span>
            </div>
            <p className="mt-2 text-xs font-bold text-[#64748b]">ينتهي في ١٥ يناير ٢٠٢٧</p>
          </section>

          <section className="rounded-2xl border border-[#398b79]/20 bg-[#eff8f4] p-4 text-right">
            <p className="font-black text-[#286b5c]">عندك عذر مادي؟ تواصل معنا وابشر بالخير</p>
            <p className="mt-2 text-xs font-bold text-[#17354a] underline">أحتاج اشتراك لعذر مادي</p>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-black">اختر الباقة</h2>
            <div className="grid grid-cols-2 gap-2">
              <article className="rounded-2xl border-2 border-[#0d1b2a] bg-white p-4">
                <p className="text-xs font-bold text-[#398b79]">Pro</p>
                <p className="mt-1 text-xs text-[#64748b]">٣ أشهر</p>
                <p className="mt-3 text-2xl font-black">٣٩ <small className="text-xs">ريال</small></p>
              </article>
              <article className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
                <p className="text-xs font-bold text-[#398b79]">Pro Life Plus</p>
                <p className="mt-1 text-xs text-[#64748b]">٦ أشهر</p>
                <p className="mt-3 text-2xl font-black">٦٩ <small className="text-xs">ريال</small></p>
              </article>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-black">اختر طريقة الدفع</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-[#0d1b2a] bg-[#0d1b2a] p-3 text-center text-white">
                <p className="text-lg">▣</p><p className="text-xs font-black">بطاقة</p>
              </div>
              <div className="rounded-2xl border border-[#e5e7eb] bg-white p-3 text-center">
                <p className="text-lg">▤</p><p className="text-xs font-black">المحفظة</p>
              </div>
            </div>
          </section>

          <button className="w-full rounded-xl bg-[#0d1b2a] px-4 py-3 font-black text-white">
            ادفع ٣٩ ريال بالبطاقة
          </button>
          <p className="text-center text-[11px] font-medium leading-5 text-[#94a3b8]">
            التمديد يضيف ٩٠ يومًا إلى نهاية اشتراكك الحالي، أو يبدأ من اليوم إذا كان منتهيًا.
          </p>
        </div>
      </section>
    </main>
  );
}
