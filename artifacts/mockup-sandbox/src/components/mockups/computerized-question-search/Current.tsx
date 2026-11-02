import { useState, type FormEvent } from "react";
import { Search, Sparkles } from "lucide-react";
import "./_group.css";

export function Current() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  };

  return (
    <main className="computer-search-preview min-h-screen bg-background p-5 text-foreground md:p-10" dir="rtl">
      <section className="mx-auto max-w-4xl rounded-[1.5rem] border border-[#E4D8E9] bg-[#FCF9FD] p-5 md:p-6">
        <div>
          <p className="text-xs font-black text-[#7A4B91]">المحوسب · سؤال مباشر</p>
          <h2 className="mt-1 text-2xl font-black">ابحث عن سؤال فقط</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            اكتب كلمة أو رقم السؤال للوصول إليه بعد إضافة بنك الأسئلة الجديد وتصنيفه.
          </p>
        </div>
        <form onSubmit={submitSearch} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="computerized-question-search" className="sr-only">ابحث في بنك الأسئلة</label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="computerized-question-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="مثال: سؤال الهندسة أو رقم السؤال"
              className="h-12 w-full rounded-xl border border-[#DCCDE3] bg-white pr-10 pl-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#7A4B91] focus:ring-2 focus:ring-[#7A4B91]/15"
            />
          </div>
          <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#7A4B91] px-5 text-sm font-black text-white transition hover:bg-[#633D77]">
            بحث
            <Search className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-4 rounded-xl border border-dashed border-[#DCCDE3] bg-white/70 px-3 py-3 text-xs leading-5 text-slate-500">
          {submittedQuery
            ? `لا توجد نتائج حالية لعبارة «${submittedQuery}». ستظهر النتائج بعد إضافة الداتا الجديدة ومراجعتها.`
            : "نتائج البحث ستظهر هنا بعد إضافة الداتا الجديدة ومراجعتها."}
        </div>
        <div className="mt-4 flex flex-col gap-4 border-t border-[#E4D8E9] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black">البحث المتقدم</p>
            <p className="mt-1 text-xs text-slate-500">يمكن ربط الفلاتر بالقسم والمصدر والمستوى عند وصول الداتا.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500/10 px-3 py-2 text-[11px] font-black text-[#7A4B91]">
            <Sparkles className="h-3.5 w-3.5" />
            جاهز للتصنيف
          </span>
        </div>
      </section>
    </main>
  );
}
