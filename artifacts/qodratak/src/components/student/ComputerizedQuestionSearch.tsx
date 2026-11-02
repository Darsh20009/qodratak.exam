import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  AlertCircle,
  Check,
  FileImage,
  ImagePlus,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getQuestionImageUrls } from "@/lib/questionImages";
import { resolveFoundationAssetUrl } from "@/lib/foundationVideoUrl";

type QuestionCategory = "verbal" | "quantitative" | "general";
type SearchCategory = "all" | QuestionCategory;
type SearchStatus = "idle" | "loading" | "success" | "error";
type OcrStatus = "idle" | "loading" | "success" | "error";

type SearchQuestion = {
  questionId: number;
  category: QuestionCategory;
  subcategory: string;
  text: string;
  options: string[];
  difficulty: string;
  topic?: string;
  section?: number;
  imageUrl?: string;
  imageUrls?: string[];
};

type SearchResponse = {
  total: number;
  results: SearchQuestion[];
};

const SEARCH_CATEGORIES: Array<{ key: SearchCategory; label: string }> = [
  { key: "all", label: "الكل" },
  { key: "quantitative", label: "الكمي" },
  { key: "verbal", label: "اللفظي" },
];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function firstUsefulOcrLine(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.replace(/[^\p{L}\p{N}]/gu, "").length >= 5);
  const bestLine = lines.find((line) => line.length >= 12 && line.length <= 180) ?? lines[0] ?? "";
  return bestLine.slice(0, 240);
}

export function ComputerizedQuestionSearch() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const [results, setResults] = useState<SearchQuestion[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [searchError, setSearchError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRequestId = useRef(0);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const performSearch = async (
    searchTerm: string,
    searchCategory: SearchCategory = category,
  ) => {
    const cleanQuery = searchTerm.trim().slice(0, 240);
    if (!cleanQuery || (cleanQuery.length < 2 && !/^\d+$/.test(cleanQuery))) {
      setSearchStatus("error");
      setSearchError("اكتب كلمة من حرفين على الأقل أو رقم السؤال.");
      setResults([]);
      setResultCount(0);
      return;
    }

    const requestId = ++searchRequestId.current;
    setSubmittedQuery(cleanQuery);
    setSearchStatus("loading");
    setSearchError("");
    try {
      const params = new URLSearchParams({ query: cleanQuery });
      if (searchCategory !== "all") params.set("category", searchCategory);
      const response = await apiRequest("GET", `/api/student/questions/search?${params.toString()}`);
      const payload = await response.json() as SearchResponse;
      if (requestId !== searchRequestId.current) return;
      setResults(Array.isArray(payload.results) ? payload.results : []);
      setResultCount(Number.isFinite(payload.total) ? payload.total : 0);
      setSearchStatus("success");
    } catch {
      if (requestId !== searchRequestId.current) return;
      setResults([]);
      setResultCount(0);
      setSearchStatus("error");
      setSearchError("تعذر الاتصال ببنك الأسئلة. تحقق من اتصالك ثم أعد المحاولة.");
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void performSearch(query);
  };

  const processImage = async (file: File) => {
    setOcrError("");
    setOcrText("");
    setOcrProgress(0);
    setImageFile(file);
    setOcrStatus("loading");

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(["ara", "eng"], 1, {
        workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js",
        corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0",
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
        gzip: true,
        logger: (message) => {
          if (message.status === "recognizing text") {
            setOcrProgress(Math.round(message.progress * 100));
          }
        },
      });

      try {
        const { data } = await worker.recognize(file);
        const extractedText = data.text.replace(/\s+/g, " ").trim().slice(0, 240);
        const searchPhrase = firstUsefulOcrLine(data.text) || extractedText;
        if (!searchPhrase) {
          setOcrStatus("error");
          setOcrError("لم يظهر نص واضح في الصورة. جرّب صورة أقرب أو اكتب جزءًا من السؤال يدويًا.");
          return;
        }
        setOcrText(extractedText);
        setQuery(searchPhrase);
        setOcrStatus("success");
      } finally {
        await worker.terminate();
      }
    } catch (error) {
      console.error("Question image OCR failed:", error);
      setOcrStatus("error");
      setOcrError("تعذر قراءة الصورة. يمكنك كتابة نص السؤال يدويًا أو تجربة صورة أوضح.");
    }
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageFile(null);
      setOcrStatus("error");
      setOcrError("استخدم صورة بصيغة JPG أو PNG أو WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageFile(null);
      setOcrStatus("error");
      setOcrError("حجم الصورة كبير. الحد الأقصى ٨ ميجابايت.");
      return;
    }
    void processImage(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setOcrText("");
    setOcrStatus("idle");
    setOcrProgress(0);
    setOcrError("");
  };

  const changeCategory = (nextCategory: SearchCategory) => {
    setCategory(nextCategory);
    if (submittedQuery) void performSearch(submittedQuery, nextCategory);
  };

  const searchByRecognizedText = () => {
    const text = (ocrText || query).trim().slice(0, 240);
    if (text) {
      setQuery(text);
      void performSearch(text);
    }
  };

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm" aria-labelledby="computerized-search-title">
      <div className="border-b border-border bg-gradient-to-l from-[#F3EAF7] via-[#FCF9FD] to-card px-5 py-5 dark:from-fuchsia-950/20 dark:via-card md:px-7 md:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-black text-[#7A4B91] dark:text-fuchsia-300">
              <Sparkles className="h-4 w-4" />
              بحث مباشر في بنك الأسئلة
            </p>
            <h2 id="computerized-search-title" className="mt-2 text-2xl font-black text-foreground">
              ابحث عن السؤال بطريقتك
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              ابحث بكلمة أو رقم السؤال، أو ارفع صورة ليُستخرج نصها وتظهر الأسئلة الأقرب.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/15 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            الإجابات الصحيحة لا تظهر هنا
          </span>
        </div>
      </div>

      <div className="grid gap-5 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_250px]">
        <div className="min-w-0">
          <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="computerized-question-search" className="sr-only">اكتب كلمة أو رقم السؤال</label>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="computerized-question-search"
                type="search"
                value={query}
                maxLength={240}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="مثال: المتوسط الحسابي أو رقم السؤال"
                autoComplete="off"
                dir="auto"
                className="h-12 w-full rounded-xl border border-border bg-background pr-10 pl-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[#7A4B91] focus:ring-2 focus:ring-[#7A4B91]/15"
              />
            </div>
            <button
              type="submit"
              disabled={searchStatus === "loading"}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#7A4B91] px-6 text-sm font-black text-white transition hover:bg-[#633D77] disabled:cursor-wait disabled:opacity-65"
            >
              {searchStatus === "loading" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              ابحث الآن
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2" aria-label="تصفية حسب القسم">
              {SEARCH_CATEGORIES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={category === item.key}
                  onClick={() => changeCategory(item.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    category === item.key
                      ? "border-[#7A4B91] bg-[#7A4B91]/10 text-[#7A4B91] dark:text-fuchsia-300"
                      : "border-border bg-background text-muted-foreground hover:border-[#7A4B91]/40"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={ocrStatus === "loading"}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#7A4B91]/25 bg-[#7A4B91]/5 px-3 text-xs font-black text-[#7A4B91] transition hover:bg-[#7A4B91]/10 disabled:opacity-60 dark:text-fuchsia-300"
            >
              <ImagePlus className="h-4 w-4" />
              ابحث بصورة
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelection}
              className="sr-only"
              aria-label="اختر صورة للسؤال"
            />
          </div>

          {imageFile && (
            <div className="mt-4 rounded-2xl border border-border bg-background p-3">
              <div className="flex items-start gap-3">
                {imagePreviewUrl ? (
                  <img src={imagePreviewUrl} alt="معاينة صورة السؤال" className="h-16 w-16 shrink-0 rounded-xl border border-border bg-card object-cover" />
                ) : (
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <FileImage className="h-6 w-6" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-foreground">{imageFile.name}</p>
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground" aria-live="polite">
                        {ocrStatus === "loading" && `جارٍ قراءة النص من الصورة${ocrProgress ? ` · ${ocrProgress}%` : ""}`}
                        {ocrStatus === "success" && "تم استخراج نص مبدئي — راجعه قبل البحث"}
                        {ocrStatus === "error" && ocrError}
                        {ocrStatus === "idle" && "الصورة تبقى على جهازك ويُرسل نص البحث فقط."}
                      </p>
                    </div>
                    <button type="button" onClick={clearImage} className="rounded-lg p-1 text-muted-foreground hover:bg-muted" aria-label="إزالة الصورة">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {ocrStatus === "success" && (
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <textarea
                        value={ocrText}
                        maxLength={240}
                        onChange={(event) => {
                          setOcrText(event.target.value);
                          setQuery(event.target.value);
                        }}
                        aria-label="النص المستخرج من الصورة"
                        rows={2}
                        className="min-h-12 flex-1 resize-y rounded-lg border border-border bg-card px-3 py-2 text-xs leading-5 text-foreground outline-none focus:border-[#7A4B91]"
                      />
                      <button type="button" onClick={searchByRecognizedText} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#7A4B91] px-4 text-xs font-black text-white hover:bg-[#633D77]">
                        <Search className="h-3.5 w-3.5" />
                        ابحث بهذا النص
                      </button>
                    </div>
                  )}
                  {ocrStatus === "loading" && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-[#7A4B91] transition-all" style={{ width: `${Math.max(8, ocrProgress)}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {!imageFile && ocrError && (
            <p role="alert" className="mt-3 flex items-center gap-2 text-xs font-bold text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {ocrError}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-black text-foreground">الأسئلة المطابقة</h3>
              {submittedQuery && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  نتائج البحث عن «{submittedQuery.slice(0, 80)}»
                </p>
              )}
            </div>
            {searchStatus === "success" && (
              <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
                {resultCount} {resultCount === 1 ? "نتيجة" : "نتائج"}
              </span>
            )}
          </div>

          {searchStatus === "idle" && (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-background px-5 py-8 text-center">
              <Search className="mx-auto h-7 w-7 text-[#7A4B91]/70" />
              <p className="mt-3 text-sm font-black text-foreground">اكتب ما تتذكره من السؤال</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">يمكنك البحث بجزء من النص أو برقم السؤال، ثم تضييق النتائج حسب القسم.</p>
            </div>
          )}

          {searchStatus === "loading" && (
            <div className="mt-4 space-y-3" aria-label="جارٍ البحث" aria-live="polite">
              {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-muted/70" />)}
            </div>
          )}

          {searchStatus === "error" && (
            <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-black">لم يكتمل البحث</p>
                <p className="mt-1 text-xs leading-5">{searchError}</p>
                {submittedQuery && (
                  <button type="button" onClick={() => void performSearch(submittedQuery)} className="mt-2 text-xs font-black underline underline-offset-4">
                    أعد المحاولة
                  </button>
                )}
              </div>
            </div>
          )}

          {searchStatus === "success" && results.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-background px-5 py-8 text-center">
              <Search className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-black text-foreground">لم نعثر على تطابق</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">جرّب عبارة أقصر أو رقم السؤال، وتأكد من تحديد القسم المناسب.</p>
            </div>
          )}

          {searchStatus === "success" && results.length > 0 && (
            <div className="mt-4 space-y-3">
              {results.map((question) => {
                const imageUrls = getQuestionImageUrls(question).slice(0, 2);
                const sectionLabel = question.category === "quantitative"
                  ? "كمي"
                  : question.category === "verbal"
                    ? "لفظي"
                    : "عام";

                return (
                  <article key={`${question.category}-${question.questionId}`} className="rounded-2xl border border-border bg-card p-4 transition hover:border-[#7A4B91]/35 hover:shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-muted-foreground">
                      <span className="rounded-full bg-[#7A4B91]/10 px-2.5 py-1 text-[#7A4B91] dark:text-fuchsia-300">{sectionLabel}</span>
                      <span>{question.subcategory}</span>
                      <span aria-hidden="true">·</span>
                      <span>السؤال {question.questionId}</span>
                      {question.difficulty && <span className="mr-auto rounded-full bg-muted px-2.5 py-1">{question.difficulty}</span>}
                    </div>
                    {question.text && <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground" dir="auto">{question.text}</p>}
                    {imageUrls.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {imageUrls.map((imageUrl, imageIndex) => (
                          <img
                            key={`${imageUrl}-${imageIndex}`}
                            src={resolveFoundationAssetUrl(imageUrl)}
                            alt={`صورة توضيحية للسؤال ${question.questionId}`}
                            loading="lazy"
                            className="max-h-64 max-w-full rounded-xl border border-border bg-white object-contain"
                          />
                        ))}
                      </div>
                    )}
                    {question.options.length > 0 && (
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <li key={`${question.questionId}-option-${optionIndex}`} className="flex min-w-0 items-start gap-2 rounded-lg bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border text-[10px] font-black text-foreground">
                              {["أ", "ب", "ج", "د"][optionIndex] ?? optionIndex + 1}
                            </span>
                            <span dir="auto">{option}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-background p-4">
            <h3 className="text-sm font-black text-foreground">البحث بصورة</h3>
            <button
              type="button"
              disabled={ocrStatus === "loading"}
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#7A4B91]/35 bg-card px-4 py-5 text-center transition hover:border-[#7A4B91] hover:bg-[#7A4B91]/5 disabled:opacity-60"
            >
              {ocrStatus === "loading"
                ? <LoaderCircle className="h-6 w-6 animate-spin text-[#7A4B91]" />
                : <ImagePlus className="h-6 w-6 text-[#7A4B91]" />}
              <span className="mt-2 text-xs font-black text-foreground">ارفع صورة السؤال</span>
              <span className="mt-1 text-[10px] leading-4 text-muted-foreground">JPG أو PNG أو WebP · حتى ٨ ميجابايت</span>
            </button>
            {imageFile && ocrStatus === "success" && (
              <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                <Check className="h-3.5 w-3.5" />
                راجع النص المستخرج قبل بدء البحث
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-emerald-700/15 bg-emerald-500/5 p-4">
            <h3 className="flex items-center gap-2 text-sm font-black text-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
              خصوصية ووضوح
            </h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              تُقرأ الصورة داخل المتصفح ولا تُرفع للخادم؛ يُرسل نص البحث فقط. وتظهر الأسئلة المعتمدة دون مفتاح الإجابة أو الشرح.
            </p>
          </div>
          <p className="px-1 text-[10px] leading-5 text-muted-foreground">
            التعرّف على الصور يحتاج اتصالًا لتنزيل بيانات القراءة العربية أول مرة. إذا لم ينجح، اكتب جزءًا من السؤال يدويًا.
          </p>
        </aside>
      </div>
    </section>
  );
}
