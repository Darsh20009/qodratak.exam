import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileImage,
  Filter,
  Hash,
  ImagePlus,
  Layers3,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import "./_group.css";

type Question = {
  id: string;
  section: string;
  title: string;
  excerpt: string;
  difficulty: string;
  source: string;
  tags: string[];
  number: string;
};

const demoQuestions: Question[] = [
  {
    id: "q-20418",
    number: "20418",
    section: "كمي · حساب",
    title: "المتوسط الحسابي للأعداد",
    excerpt: "إذا كان متوسط الأعداد ٨، ١٢، ١٥، س يساوي ١١، فما قيمة س؟",
    difficulty: "متوسط",
    source: "تجميعات المحوسب · ١٤٤٥",
    tags: ["المتوسط الحسابي", "الأعداد"],
  },
  {
    id: "q-19372",
    number: "19372",
    section: "كمي · هندسة",
    title: "مساحة المستطيل",
    excerpt: "مستطيل محيطه ٣٠ سم، وطوله يزيد عن عرضه بـ ٣ سم. أوجد مساحته.",
    difficulty: "متوسط",
    source: "تجميعات المحوسب · ١٤٤٤",
    tags: ["المساحة", "الهندسة"],
  },
  {
    id: "q-18806",
    number: "18806",
    section: "لفظي · تناظر",
    title: "العلاقة بين الكلمات",
    excerpt: "اختر الزوج الذي تربطه بالكلمة الأولى العلاقة نفسها: بذرة : شجرة",
    difficulty: "سهل",
    source: "بنك التدريب · لفظي",
    tags: ["التناظر اللفظي", "العلاقات"],
  },
];

const popularSearches = ["المتوسط الحسابي", "التناظر اللفظي", "مساحة المستطيل"];

export function FinderConcept() {
  const [query, setQuery] = useState("المتوسط الحسابي");
  const [results, setResults] = useState<Question[]>(demoQuestions);
  const [status, setStatus] = useState<"results" | "empty" | "loading">("results");
  const [activeSection, setActiveSection] = useState("الكل");
  const [imageName, setImageName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [isOcr, setIsOcr] = useState(false);
  const [sortNewest, setSortNewest] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const runSearch = (value: string, section = activeSection) => {
    const clean = value.trim();
    setQuery(clean);
    setStatus("loading");
    window.setTimeout(() => {
      const normalized = clean.toLocaleLowerCase("ar");
      const matches = demoQuestions.filter((item) => {
        const haystack = [item.title, item.excerpt, item.section, item.number, ...item.tags]
          .join(" ")
          .toLocaleLowerCase("ar");
        const sectionMatch = section === "الكل" || item.section.includes(section);
        return sectionMatch && (!normalized || haystack.includes(normalized) || normalized.split(/\s+/).some((word) => word.length > 2 && haystack.includes(word)));
      });
      setResults(matches);
      setStatus(matches.length ? "results" : "empty");
    }, 520);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch(query);
  };

  const chooseSearch = (value: string) => {
    setActiveSection("الكل");
    runSearch(value);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageName(file.name);
    setImageUrl(URL.createObjectURL(file));
    setIsOcr(true);
    setOcrText("");
    window.setTimeout(() => {
      setOcrText("المتوسط الحسابي للأعداد");
      setIsOcr(false);
    }, 1050);
  };

  const useOcrText = () => {
    if (ocrText) {
      setActiveSection("الكل");
      runSearch(ocrText);
    }
  };

  const filteredResults = sortNewest ? [...results].reverse() : results;

  return (
    <main className="computer-search-preview finder-shell" dir="rtl">
      <style>{`
        .finder-shell{min-height:100dvh;background:#f1f4f3;color:#142a31;padding:28px 30px 44px;position:relative;overflow:hidden}
        .finder-shell:before{content:"";position:absolute;inset:0 0 auto;height:250px;background:radial-gradient(ellipse at 82% 0%,rgba(173,213,200,.36),transparent 55%),linear-gradient(180deg,#e8f0ed 0%,#f1f4f3 100%);pointer-events:none}
        .finder-inner{position:relative;max-width:1220px;margin:auto}
        .finder-topbar{height:48px;display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
        .finder-brand{display:flex;align-items:center;gap:11px;font-weight:800;font-size:15px;letter-spacing:-.3px}
        .finder-mark{width:34px;height:34px;border-radius:11px;background:#163d3b;color:#d7f1e5;display:grid;place-items:center;box-shadow:0 5px 12px rgba(22,61,59,.14)}
        .finder-crumb{display:flex;align-items:center;gap:9px;color:#71817f;font-size:12px;font-weight:700}
        .finder-crumb strong{color:#314c4b}
        .finder-user{display:flex;align-items:center;gap:10px;color:#596e6b;font-size:12px;font-weight:700}
        .finder-avatar{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#d6e9df;color:#24524a;font-size:12px;font-weight:900}
        .finder-title-row{display:flex;align-items:flex-end;justify-content:space-between;margin:0 0 19px}
        .finder-eyebrow{display:flex;align-items:center;gap:8px;color:#4f8577;font-size:11px;font-weight:800;letter-spacing:.1px}
        .finder-title{font-size:27px;line-height:1.3;letter-spacing:-1.2px;margin:4px 0 0;font-weight:900;color:#173332}
        .finder-subtitle{font-size:13px;color:#71817f;margin:7px 0 0}
        .finder-safe{display:flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #dce7e1;background:rgba(255,255,255,.55);border-radius:10px;color:#55746a;font-weight:700;font-size:11px}
        .finder-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:16px;align-items:start}
        .finder-main{min-width:0}
        .finder-search-card{background:#fff;border:1px solid #e1e9e5;border-radius:17px;padding:18px 20px 16px;box-shadow:0 9px 25px rgba(23,52,48,.045)}
        .finder-search-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .finder-search-label{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:900;color:#294441}
        .finder-mini-note{font-size:10px;color:#8a9995;display:flex;align-items:center;gap:5px}
        .finder-form{display:flex;gap:9px}
        .finder-input-wrap{height:49px;display:flex;align-items:center;gap:10px;flex:1;min-width:0;border:1px solid #dce6e1;border-radius:11px;padding:0 13px;background:#fbfcfb;transition:border .2s,box-shadow .2s}
        .finder-input-wrap:focus-within{border-color:#5f9c88;box-shadow:0 0 0 3px rgba(95,156,136,.12)}
        .finder-input-icon{color:#78928a;flex:none}
        .finder-input{border:0;outline:0;background:transparent;min-width:0;flex:1;color:#25413d;font:600 13px Cairo,Tajawal,sans-serif}
        .finder-input::placeholder{color:#a3afab;font-weight:500}
        .finder-clear{border:0;background:transparent;color:#9ba9a4;cursor:pointer;padding:4px;display:grid;place-items:center}
        .finder-submit{height:49px;border:0;border-radius:11px;background:#174642;color:#fff;padding:0 21px;display:flex;align-items:center;justify-content:center;gap:8px;font:800 13px Cairo,Tajawal,sans-serif;cursor:pointer;transition:transform .18s,background .18s;white-space:nowrap}
        .finder-submit:hover{background:#103b37;transform:translateY(-1px)}
        .finder-search-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}
        .finder-popular{display:flex;align-items:center;gap:7px;min-width:0}
        .finder-popular-label{font-size:10px;color:#8b9995;font-weight:700;white-space:nowrap}
        .finder-chip{border:1px solid #e4ebe7;background:#f8faf9;border-radius:7px;padding:5px 9px;color:#59736a;font:700 10px Cairo,Tajawal,sans-serif;cursor:pointer;white-space:nowrap;transition:all .18s}
        .finder-chip:hover{border-color:#afcfc0;background:#edf6f1;color:#28594d}
        .finder-image-button{border:0;background:transparent;color:#508274;font:800 11px Cairo,Tajawal,sans-serif;display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap}
        .finder-image-button:hover{color:#1a5149}
        .finder-results-header{display:flex;align-items:center;justify-content:space-between;margin:21px 2px 10px}
        .finder-results-title{font-size:14px;font-weight:900;color:#2d4743;display:flex;align-items:center;gap:8px}
        .finder-count{font-size:10px;color:#79908a;background:#e3eee9;border-radius:20px;padding:4px 8px;font-weight:800}
        .finder-sort{display:flex;align-items:center;gap:7px;border:0;background:transparent;color:#6a807a;font:700 11px Cairo,Tajawal,sans-serif;cursor:pointer}
        .finder-list{display:flex;flex-direction:column;gap:10px}
        .finder-result{border:1px solid #e2e9e5;background:#fff;border-radius:13px;padding:15px 17px;box-shadow:0 4px 12px rgba(23,52,48,.025);transition:transform .18s,border-color .18s}
        .finder-result:hover{transform:translateY(-2px);border-color:#bfd5ca}
        .finder-result-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
        .finder-result-meta{display:flex;align-items:center;gap:8px;color:#779087;font-size:10px;font-weight:800}
        .finder-dot{width:3px;height:3px;border-radius:50%;background:#afc2b9}
        .finder-question-title{margin:7px 0 5px;font-size:14px;font-weight:900;color:#21423c;letter-spacing:-.2px}
        .finder-excerpt{font-size:12px;line-height:1.85;color:#657873;margin:0;max-width:740px}
        .finder-id{direction:ltr;display:flex;align-items:center;gap:4px;color:#99a8a2;font:700 10px Cairo,Tajawal,sans-serif;white-space:nowrap}
        .finder-result-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid #f0f3f1}
        .finder-tags{display:flex;gap:6px}
        .finder-tag{font-size:9px;color:#638275;background:#f0f6f2;border-radius:5px;padding:4px 7px;font-weight:700}
        .finder-source{display:flex;align-items:center;gap:5px;color:#91a09b;font-size:10px}
        .finder-open{display:flex;align-items:center;gap:5px;border:0;background:transparent;color:#478071;font:800 10px Cairo,Tajawal,sans-serif;cursor:pointer;padding:4px}
        .finder-side{display:flex;flex-direction:column;gap:12px}
        .finder-side-card{background:#fff;border:1px solid #e1e9e5;border-radius:15px;padding:17px;box-shadow:0 7px 20px rgba(23,52,48,.035)}
        .finder-side-title{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:900;color:#2c4843;margin:0 0 14px}
        .finder-filter-item{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #eff3f1;padding:11px 0 0;margin-top:10px}
        .finder-filter-item:first-of-type{border-top:0;padding-top:0;margin-top:0}
        .finder-filter-name{font-size:11px;font-weight:800;color:#657873}
        .finder-select{border:0;background:#f4f7f5;border-radius:7px;padding:6px 8px;color:#31574e;font:700 10px Cairo,Tajawal,sans-serif;outline:0;cursor:pointer}
        .finder-filter-hint{font-size:9px;color:#9aa8a3;margin:9px 0 0;line-height:1.7}
        .finder-trust{background:#e5f0e9;border-color:#d6e6dd}
        .finder-trust .finder-side-title{color:#28564a;margin-bottom:8px}
        .finder-trust-copy{font-size:10px;line-height:1.8;color:#648078;margin:0}
        .finder-trust-mark{margin-top:12px;padding-top:10px;border-top:1px solid #d3e4da;display:flex;align-items:center;gap:7px;color:#4f796a;font-size:9px;font-weight:800}
        .finder-image-state{margin-top:12px;border:1px solid #dce9e2;border-radius:10px;background:#f6faf7;padding:10px;display:flex;align-items:center;gap:10px}
        .finder-image-preview{width:48px;height:48px;border-radius:7px;background:#e2ece7;object-fit:cover;flex:none}
        .finder-file-icon{width:48px;height:48px;border-radius:7px;background:#e2ece7;color:#518274;display:grid;place-items:center;flex:none}
        .finder-image-info{min-width:0;flex:1}
        .finder-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:800;color:#45645a}
        .finder-ocr-status{display:flex;align-items:center;gap:5px;margin-top:4px;font-size:9px;color:#81958c}
        .finder-ocr-action{border:0;background:transparent;color:#357566;font:800 9px Cairo,Tajawal,sans-serif;cursor:pointer;white-space:nowrap}
        .finder-empty,.finder-loading{border:1px dashed #d2dfd8;background:rgba(255,255,255,.64);border-radius:14px;min-height:210px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;color:#72857e}
        .finder-empty-icon{width:45px;height:45px;border-radius:14px;background:#e6efea;color:#598775;display:grid;place-items:center;margin-bottom:10px}
        .finder-empty h3{font-size:14px;color:#38564e;margin:0 0 5px}
        .finder-empty p{font-size:11px;line-height:1.8;margin:0;max-width:330px}
        .finder-reset{margin-top:12px;border:0;background:#174642;color:white;border-radius:8px;padding:8px 13px;font:800 10px Cairo,Tajawal,sans-serif;cursor:pointer}
        .finder-skeleton{width:100%;max-width:680px;height:62px;background:linear-gradient(90deg,#edf2ef 25%,#f7f9f8 45%,#edf2ef 65%);background-size:200% 100%;border-radius:9px;margin:5px 0;animation:finder-shimmer 1.2s linear infinite}
        @keyframes finder-shimmer{to{background-position:-200% 0}}
        .finder-disclaimer{font-size:9px;color:#97a49f;text-align:center;margin:16px 0 0}
        @media(max-width:850px){.finder-shell{padding:20px 18px 36px}.finder-layout{grid-template-columns:minmax(0,1fr) 240px;gap:12px}.finder-side-card{padding:14px}.finder-popular{overflow:auto}.finder-title{font-size:24px}}
        @media(max-width:680px){.finder-shell{padding:14px 13px 30px}.finder-topbar{height:40px;margin-bottom:19px}.finder-crumb{display:none}.finder-user span{display:none}.finder-title-row{align-items:flex-start;flex-direction:column;gap:12px}.finder-title{font-size:23px}.finder-safe{font-size:10px}.finder-layout{display:flex;flex-direction:column}.finder-main,.finder-side{width:100%}.finder-side{display:grid;grid-template-columns:1fr}.finder-search-card{padding:15px 13px}.finder-form{gap:7px}.finder-submit{padding:0 14px}.finder-search-foot{align-items:flex-start;flex-direction:column}.finder-popular{width:100%;padding-bottom:2px}.finder-image-button{padding:3px 0}.finder-result{padding:13px}.finder-result-bottom{align-items:flex-start;gap:8px}.finder-source{display:none}.finder-results-header{margin-top:17px}.finder-subtitle{font-size:12px}}
        @media(prefers-reduced-motion:reduce){.finder-shell *{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
      `}</style>

      <div className="finder-inner">
        <header className="finder-topbar">
          <div className="finder-brand">
            <span className="finder-mark"><BookOpen size={17} strokeWidth={2.3} /></span>
            <span>قدراتك</span>
          </div>
          <nav className="finder-crumb" aria-label="مسار الصفحة">
            <span>المحوسب</span><ArrowLeft size={12} /><strong>البحث عن سؤال</strong>
          </nav>
          <div className="finder-user">
            <span>مساحة التعلّم</span><span className="finder-avatar">م</span>
          </div>
        </header>

        <section className="finder-title-row">
          <div>
            <div className="finder-eyebrow"><Sparkles size={13} /> مكتبة الأسئلة</div>
            <h1 className="finder-title">سؤالك أقرب مما تتوقع</h1>
            <p className="finder-subtitle">ابحث بكلمة، رقم السؤال، أو ارفع صورة لنقرأ نصّها معًا.</p>
          </div>
          <div className="finder-safe"><ShieldCheck size={15} /> بنك منظم للمراجعة والتدريب</div>
        </section>

        <div className="finder-layout">
          <section className="finder-main">
            <div className="finder-search-card">
              <div className="finder-search-head">
                <label className="finder-search-label" htmlFor="finder-query"><Search size={15} /> ابحث في الأسئلة</label>
                <span className="finder-mini-note"><Hash size={12} /> كلمة أو رقم سؤال</span>
              </div>
              <form className="finder-form" onSubmit={submitSearch}>
                <div className="finder-input-wrap">
                  <Search size={17} className="finder-input-icon" />
                  <input
                    id="finder-query"
                    ref={inputRef}
                    className="finder-input"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="مثال: المتوسط الحسابي أو 20418"
                    aria-label="ابحث في بنك الأسئلة"
                  />
                  {query && <button className="finder-clear" type="button" aria-label="مسح البحث" onClick={() => { setQuery(""); inputRef.current?.focus(); }}><X size={15} /></button>}
                </div>
                <button className="finder-submit" type="submit"><span>ابحث الآن</span><ArrowLeft size={15} /></button>
              </form>
              <div className="finder-search-foot">
                <div className="finder-popular">
                  <span className="finder-popular-label">جرّب:</span>
                  {popularSearches.map((term) => <button className="finder-chip" key={term} type="button" onClick={() => chooseSearch(term)}>{term}</button>)}
                </div>
                <button className="finder-image-button" type="button" onClick={() => fileRef.current?.click()}><ImagePlus size={15} /> البحث بصورة</button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />
              </div>
              {imageName && (
                <div className="finder-image-state">
                  {imageUrl ? <img className="finder-image-preview" src={imageUrl} alt="معاينة الصورة المرفوعة" /> : <span className="finder-file-icon"><FileImage size={19} /></span>}
                  <div className="finder-image-info">
                    <div className="finder-file-name">{imageName}</div>
                  <div className="finder-ocr-status">{isOcr ? <><LoaderCircle className="finder-rotating" size={12} /> جارٍ التعرّف على نص السؤال…</> : <><Check size={11} /> نص مستخرج تجريبي</>}</div>
                  </div>
                  {!isOcr && <button className="finder-ocr-action" type="button" onClick={useOcrText}>ابحث بالنص</button>}
                  <button className="finder-clear" type="button" aria-label="إزالة الصورة" onClick={() => { if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(""); setImageName(""); setOcrText(""); }}><X size={14} /></button>
                </div>
              )}
            </div>

            <div className="finder-results-header">
              <div className="finder-results-title">الأسئلة المطابقة <span className="finder-count">{status === "results" ? `${results.length} نتائج` : status === "loading" ? "…" : "٠ نتائج"}</span></div>
              {status === "results" && <button className="finder-sort" type="button" onClick={() => setSortNewest(!sortNewest)}><ArrowDownUp size={13} /> {sortNewest ? "الأقدم أولًا" : "الأقرب صلة"} <ChevronDown size={12} /></button>}
            </div>

            {status === "loading" ? (
              <div className="finder-loading" aria-label="جارٍ تحميل النتائج"><div className="finder-skeleton" /><div className="finder-skeleton" /><div className="finder-skeleton" /></div>
            ) : status === "empty" ? (
              <div className="finder-empty">
                <span className="finder-empty-icon"><Search size={21} /></span>
                <h3>ما لقينا سؤالًا بهذه العبارة</h3>
                <p>جرّب كلمة أقصر أو رقم السؤال، أو اختر أحد اقتراحات البحث بالأعلى.</p>
                <button className="finder-reset" type="button" onClick={() => { setActiveSection("الكل"); chooseSearch("المتوسط الحسابي"); }}>عرض أسئلة مقترحة</button>
              </div>
            ) : (
              <div className="finder-list">
                {filteredResults.map((item) => (
                  <article className="finder-result" key={item.id}>
                    <div className="finder-result-top">
                      <div>
                        <div className="finder-result-meta"><span>{item.section}</span><i className="finder-dot" /> <span>{item.difficulty}</span></div>
                        <h2 className="finder-question-title">{item.title}</h2>
                        <p className="finder-excerpt">{item.excerpt}</p>
                      </div>
                      <span className="finder-id">#{item.number}</span>
                    </div>
                    <div className="finder-result-bottom">
                      <div className="finder-tags">{item.tags.map((tag) => <span className="finder-tag" key={tag}>{tag}</span>)}</div>
                      <span className="finder-source"><Layers3 size={12} /> {item.source}</span>
                      <button className="finder-open" type="button" onClick={() => setActiveQuestion(item)}>معاينة السؤال <ArrowUpRight size={13} /></button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <p className="finder-disclaimer">واجهة تصورية ببيانات تجريبية للعرض فقط · لا تمثل نتائج بنك فعلي</p>
          </section>

          <aside className="finder-side">
            <div className="finder-side-card">
              <h2 className="finder-side-title"><Filter size={15} /> تضييق النتائج</h2>
              <div className="finder-filter-item">
                <label className="finder-filter-name" htmlFor="finder-section">القسم</label>
                <select id="finder-section" className="finder-select" value={activeSection} onChange={(event) => { const section = event.target.value; setActiveSection(section); runSearch(query, section); }}>
                  <option value="الكل">الكل</option><option value="كمي">كمي</option><option value="لفظي">لفظي</option>
                </select>
              </div>
              <div className="finder-filter-item">
                <span className="finder-filter-name">نوع السؤال</span>
                <span className="finder-select">الكل <ChevronDown size={10} /></span>
              </div>
              <p className="finder-filter-hint">اختر قسمًا لتصفية النتائج التجريبية الظاهرة.</p>
            </div>
            <div className="finder-side-card finder-trust">
              <h2 className="finder-side-title"><ShieldCheck size={16} /> تعلّم بثقة</h2>
              <p className="finder-trust-copy">كل سؤال يُعرض مع تصنيفه ومصدره لتسهيل مراجعتك. استخدم رقم السؤال للوصول المباشر.</p>
              <div className="finder-trust-mark"><CircleHelp size={13} /> نتائج هذا النموذج للتوضيح فقط</div>
            </div>
            <div className="finder-side-card">
              <h2 className="finder-side-title"><Clock3 size={15} /> بحثك الأخير</h2>
              <button className="finder-chip" type="button" onClick={() => chooseSearch("المتوسط الحسابي")}>المتوسط الحسابي</button>
              <p className="finder-filter-hint">اضغط لإعادة البحث بسرعة.</p>
            </div>
          </aside>
        </div>
      </div>
      {activeQuestion && (
        <div className="finder-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveQuestion(null); }}>
          <section className="finder-modal" role="dialog" aria-modal="true" aria-labelledby="finder-modal-title">
            <button className="finder-modal-close" type="button" aria-label="إغلاق المعاينة" onClick={() => setActiveQuestion(null)}><X size={17} /></button>
            <div className="finder-eyebrow"><BookOpen size={13} /> معاينة سؤال · {activeQuestion.section}</div>
            <h2 id="finder-modal-title" className="finder-modal-title">{activeQuestion.title}</h2>
            <p className="finder-modal-question">{activeQuestion.excerpt}</p>
            <div className="finder-answer-option"><span>أ</span> ١٠</div>
            <div className="finder-answer-option"><span>ب</span> ١٢</div>
            <div className="finder-answer-option"><span>ج</span> ١٤</div>
            <div className="finder-answer-option"><span>د</span> ١٦</div>
            <p className="finder-modal-note"><ShieldCheck size={13} /> محتوى خيارات توضيحي لهذا النموذج، وليس سؤالًا من بنك فعلي.</p>
            <button className="finder-submit finder-modal-done" type="button" onClick={() => setActiveQuestion(null)}>إغلاق المعاينة</button>
          </section>
        </div>
      )}
      <style>{`
        .finder-rotating{animation:finder-turn 1.1s linear infinite}
        @keyframes finder-turn{to{transform:rotate(360deg)}}
        .finder-modal-backdrop{position:fixed;inset:0;background:rgba(17,43,40,.38);display:grid;place-items:center;padding:18px;z-index:20;backdrop-filter:blur(3px)}
        .finder-modal{position:relative;width:min(100%,460px);border-radius:17px;background:#fff;padding:25px;box-shadow:0 24px 70px rgba(16,48,42,.22);animation:finder-pop .2s ease-out}
        @keyframes finder-pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .finder-modal-close{position:absolute;top:15px;left:15px;border:0;background:#f1f5f2;color:#678078;border-radius:8px;width:30px;height:30px;display:grid;place-items:center;cursor:pointer}
        .finder-modal-title{color:#244740;font-size:19px;margin:15px 0 8px}
        .finder-modal-question{font-size:13px;line-height:1.9;color:#627871;margin:0 0 15px}
        .finder-answer-option{display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid #e5ece8;border-radius:9px;margin:7px 0;color:#50675f;font-size:12px}
        .finder-answer-option span{width:22px;height:22px;display:grid;place-items:center;border-radius:6px;background:#eff5f1;color:#528071;font-weight:800}
        .finder-modal-note{display:flex;align-items:center;gap:6px;color:#8a9b94;font-size:10px;margin:15px 0}
        .finder-modal-done{width:100%;height:43px}
        @media(prefers-reduced-motion:reduce){.finder-rotating{animation:none}}
      `}</style>
    </main>
  );
}
