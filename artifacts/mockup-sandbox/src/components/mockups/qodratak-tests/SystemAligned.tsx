import "./_group.css";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  BookMarked,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  PenTool,
  Play,
  RotateCcw,
  Shuffle,
  SkipForward,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

type PreviewState = "bank" | "break";
type Category = "verbal" | "quantitative" | "standard";

const categories: { id: Category; label: string; Icon: typeof BookOpen }[] = [
  { id: "verbal", label: "القسم اللفظي", Icon: BookOpen },
  { id: "quantitative", label: "القسم الكمي", Icon: Calculator },
  { id: "standard", label: "القسم القياسي", Icon: Shuffle },
];

const topicSets: Record<Category, { title: string; count: number; Icon: typeof BookOpen }[]> = {
  verbal: [
    { title: "استيعاب المقروء", count: 280, Icon: BookMarked },
    { title: "إكمال الجمل", count: 160, Icon: PenTool },
    { title: "التناظر اللفظي", count: 140, Icon: FileText },
    { title: "الخطأ السياقي", count: 120, Icon: AlertCircle },
    { title: "المفردة الشاذة", count: 95, Icon: Sparkles },
  ],
  quantitative: [
    { title: "الحساب", count: 210, Icon: Calculator },
    { title: "الجبر", count: 180, Icon: Layers3 },
    { title: "الهندسة", count: 145, Icon: BookOpen },
    { title: "الإحصاء", count: 95, Icon: FileText },
  ],
  standard: [
    { title: "تدريب متوازن", count: 120, Icon: Shuffle },
    { title: "محاكاة كاملة", count: 120, Icon: Clock3 },
  ],
};

const tests = [
  { number: 1, completed: true, score: 72, progress: 100, attempts: 2 },
  { number: 2, completed: false, score: undefined, progress: 40, attempts: 1 },
  { number: 3, completed: false, score: undefined, progress: 0, attempts: 0 },
];

const categoryNames: Record<Category, string> = {
  verbal: "اللفظية",
  quantitative: "الكمية",
  standard: "القياسية",
};

export function SystemAligned() {
  const [previewState, setPreviewState] = useState<PreviewState>(() =>
    new URLSearchParams(window.location.search).get("state") === "break" ? "break" : "bank",
  );
  const [category, setCategory] = useState<Category>("verbal");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [breakTimeLeft, setBreakTimeLeft] = useState(30);
  const [nextSection, setNextSection] = useState(2);

  useEffect(() => {
    if (previewState !== "break") return;
    const timer = window.setTimeout(() => {
      if (breakTimeLeft <= 1) {
        setBreakTimeLeft(30);
        setNextSection((section) => section + 1);
        setPreviewState("bank");
      } else {
        setBreakTimeLeft((seconds) => seconds - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [previewState, breakTimeLeft]);

  const openBreak = () => {
    setBreakTimeLeft(30);
    setPreviewState("break");
  };

  const continueNow = () => {
    setBreakTimeLeft(30);
    setNextSection((section) => section + 1);
    setPreviewState("bank");
  };

  const formatTime = (seconds: number) => `00:${String(seconds).padStart(2, "0")}`;
  const currentTopics = topicSets[category];
  const overallProgress = category === "verbal" ? 28 : category === "quantitative" ? 36 : 19;

  return (
    <div className="sa-shell" dir="rtl" lang="ar">
      <style>{`
        .sa-shell {
          --sa-ink: #0D1B2A;
          --sa-slate: #1E2938;
          --sa-mist: #94A3B8;
          --sa-signal: #F7F775;
          --sa-canvas: #E5E7EB;
          --sa-surface: #F7F8FA;
          --sa-line: #D9DEE5;
          --sa-success: #386F5C;
          min-height: 100dvh;
          color: var(--sa-ink);
          background:
            radial-gradient(ellipse at 92% 0%, rgba(247,247,117,.16), transparent 29rem),
            linear-gradient(180deg, #F7F8FA 0%, #F1F4F6 100%);
          font-family: "Tajawal", "Cairo", system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .sa-shell * { box-sizing: border-box; }
        .sa-topbar {
          position: sticky; top: 0; z-index: 5; display: flex; align-items: center;
          justify-content: space-between; gap: 1rem; min-height: 66px; padding: 10px clamp(16px, 4vw, 56px);
          border-bottom: 1px solid rgba(13,27,42,.09); background: rgba(247,248,250,.92);
          backdrop-filter: blur(14px);
        }
        .sa-brand { display:flex; align-items:center; gap:11px; min-width: 0; }
        .sa-brand-mark {
          display:grid; place-items:center; width:37px; height:37px; border-radius:12px;
          color:var(--sa-signal); background:var(--sa-ink); font-size:17px; font-weight:900;
          box-shadow: 0 5px 12px rgba(13,27,42,.13);
        }
        .sa-brand-copy { line-height:1.15; }
        .sa-brand-copy strong { display:block; font-size:17px; font-weight:800; letter-spacing:-.02em; }
        .sa-brand-copy span { display:block; margin-top:4px; color:#6C7886; font-size:11px; font-weight:600; }
        .sa-preview-switch {
          display:flex; align-items:center; gap:4px; padding:4px; border:1px solid #DDE2E8;
          border-radius:12px; background:#EEF1F3;
        }
        .sa-preview-switch button {
          display:flex; align-items:center; justify-content:center; gap:7px; min-height:36px;
          padding:0 14px; border:0; border-radius:9px; color:#596879; background:transparent;
          font:700 13px inherit; font-family:inherit; cursor:pointer; transition:background .18s ease,color .18s ease, transform .18s ease;
        }
        .sa-preview-switch button[aria-pressed="true"] {
          color:var(--sa-ink); background:#fff; box-shadow:0 2px 6px rgba(13,27,42,.09);
        }
        .sa-preview-switch button:hover { color:var(--sa-ink); }
        .sa-preview-switch button:focus-visible, .sa-shell button:focus-visible {
          outline:3px solid #B6BB4C; outline-offset:3px;
        }
        .sa-bank { width:min(1160px, 100%); margin:0 auto; padding:28px clamp(16px, 3.4vw, 42px) 52px; }
        .sa-intro {
          display:grid; grid-template-columns:minmax(0,1fr) auto; gap:20px; align-items:center;
          padding:26px 30px; border:1px solid rgba(13,27,42,.07); border-radius:20px;
          background:linear-gradient(115deg, #fff 0%, #F9FAF8 70%, #F2F4E7 100%);
          box-shadow:0 12px 32px rgba(13,27,42,.045);
        }
        .sa-eyebrow { display:flex; align-items:center; gap:8px; margin:0 0 7px; color:#526576; font-size:12px; font-weight:800; letter-spacing:.045em; }
        .sa-eyebrow-mark { width:7px; height:7px; border-radius:50%; background:#8D9851; }
        .sa-intro h1 { margin:0; color:var(--sa-ink); font-size:clamp(27px,3.3vw,38px); font-weight:900; letter-spacing:-.04em; line-height:1.1; }
        .sa-intro p { max-width:610px; margin:10px 0 0; color:#637180; font-size:15px; line-height:1.75; }
        .sa-account {
          width:205px; padding:15px 16px; border:1px solid #E4E5C6; border-radius:15px;
          background:#FBFBEA; text-align:right;
        }
        .sa-account-head { display:flex; align-items:center; gap:8px; color:#3A4651; font-size:12px; font-weight:800; }
        .sa-account-head svg { color:#7B813D; }
        .sa-account p { margin:6px 0 10px; color:#6A7050; font-size:13px; line-height:1.4; }
        .sa-limit-track { height:5px; overflow:hidden; border-radius:99px; background:#E6E6C3; }
        .sa-limit-track span { display:block; height:100%; width:50%; border-radius:inherit; background:#969A45; }
        .sa-metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); margin:22px 0 25px; padding:15px 5px; border:1px solid #E2E6E9; border-radius:15px; background:rgba(255,255,255,.72); }
        .sa-metric { position:relative; display:flex; align-items:center; justify-content:center; gap:12px; min-height:49px; }
        .sa-metric:not(:last-child)::after { content:""; position:absolute; inset-inline-end:0; height:30px; width:1px; background:#E1E5E8; }
        .sa-metric-icon { display:grid; place-items:center; width:34px; height:34px; border-radius:11px; color:#526579; background:#EDF1F3; }
        .sa-metric strong { display:block; font-size:19px; line-height:1.1; font-weight:900; }
        .sa-metric span { display:block; margin-top:3px; color:#75818D; font-size:11px; font-weight:600; }
        .sa-content { padding:0 1px; }
        .sa-category-tabs {
          display:flex; justify-content:center; gap:5px; width:max-content; max-width:100%; margin:0 auto 22px;
          padding:5px; border:1px solid #DFE4E8; border-radius:14px; background:#EEF1F2;
        }
        .sa-category-tabs button {
          display:flex; align-items:center; justify-content:center; gap:8px; min-height:42px; padding:0 19px;
          border:0; border-radius:10px; background:transparent; color:#62707E;
          font-family:inherit; font-size:14px; font-weight:800; white-space:nowrap; cursor:pointer;
          transition:background .18s ease,color .18s ease,box-shadow .18s ease;
        }
        .sa-category-tabs button[aria-selected="true"] { color:#fff; background:var(--sa-ink); box-shadow:0 4px 10px rgba(13,27,42,.16); }
        .sa-category-tabs button:hover:not([aria-selected="true"]) { color:var(--sa-ink); background:rgba(255,255,255,.65); }
        .sa-section-heading { display:flex; align-items:end; justify-content:space-between; gap:14px; margin:0 1px 12px; }
        .sa-section-heading h2 { margin:0; color:#213244; font-size:17px; font-weight:900; }
        .sa-section-heading p { margin:4px 0 0; color:#778390; font-size:12px; }
        .sa-clear-filter { border:0; padding:5px 8px; color:#526576; background:transparent; font:700 12px inherit; font-family:inherit; cursor:pointer; }
        .sa-clear-filter:hover { color:#0D1B2A; text-decoration:underline; }
        .sa-topics { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; margin-bottom:24px; }
        .sa-topic {
          position:relative; display:flex; flex-direction:column; align-items:flex-start; gap:12px; min-height:106px;
          padding:14px 14px 12px; border:1px solid #E1E5E8; border-radius:14px; background:rgba(255,255,255,.84);
          color:var(--sa-ink); text-align:right; font-family:inherit; cursor:pointer;
          transition:border-color .18s ease,background .18s ease,transform .18s ease;
        }
        .sa-topic:hover { transform:translateY(-2px); border-color:#ADB8C3; }
        .sa-topic[aria-pressed="true"] { border-color:#879248; background:#F7F8E9; }
        .sa-topic-icon { display:grid; place-items:center; width:33px; height:33px; border-radius:10px; color:#41576A; background:#EDF1F3; }
        .sa-topic[aria-pressed="true"] .sa-topic-icon { color:#555B2D; background:#E8EABF; }
        .sa-topic-title { font-size:13px; font-weight:800; line-height:1.25; }
        .sa-topic-count { color:#7A8692; font-size:11px; font-weight:600; }
        .sa-progress-panel { padding:16px 18px 17px; margin-bottom:18px; border:1px solid #E1E5E8; border-radius:15px; background:rgba(255,255,255,.79); }
        .sa-progress-top { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px; color:#344658; font-size:13px; font-weight:800; }
        .sa-progress-top span:last-child { color:#657383; font-size:12px; font-weight:700; }
        .sa-progress-track { height:8px; overflow:hidden; border-radius:99px; background:#E5E9EB; direction:ltr; }
        .sa-progress-track span { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#31465A,#627B78); transition:width .25s ease; }
        .sa-test-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
        .sa-test-card {
          overflow:hidden; border:1px solid #E1E5E8; border-radius:16px; background:#fff;
          box-shadow:0 5px 16px rgba(13,27,42,.035); transition:transform .2s ease,box-shadow .2s ease;
        }
        .sa-test-card:hover { transform:translateY(-2px); box-shadow:0 10px 22px rgba(13,27,42,.08); }
        .sa-test-card-top { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:16px 16px 12px; }
        .sa-test-name { display:flex; align-items:center; gap:11px; }
        .sa-test-icon { display:grid; place-items:center; width:39px; height:39px; border-radius:12px; color:#F7F775; background:#1E2938; }
        .sa-test-name h3 { margin:0; font-size:17px; font-weight:900; }
        .sa-test-meta { display:flex; align-items:center; gap:9px; margin-top:4px; color:#778390; font-size:11px; font-weight:600; }
        .sa-test-meta span { display:flex; align-items:center; gap:4px; }
        .sa-status { display:inline-flex; align-items:center; gap:5px; padding:5px 8px; border-radius:99px; color:#3E6A57; background:#EAF2ED; font-size:11px; font-weight:800; white-space:nowrap; }
        .sa-status.is-ready { color:#637180; background:#F0F2F4; }
        .sa-status.is-progress { color:#6B673A; background:#F5F3DC; }
        .sa-test-progress { margin:0 16px 13px; padding:11px 12px; border-radius:11px; background:#F5F7F8; }
        .sa-test-progress-head { display:flex; justify-content:space-between; gap:8px; margin-bottom:8px; color:#71808E; font-size:10px; font-weight:700; }
        .sa-test-progress-head strong { color:#526576; font-weight:800; }
        .sa-test-segments { display:grid; grid-template-columns:repeat(5,1fr); gap:5px; direction:ltr; }
        .sa-test-segments span { height:5px; border-radius:99px; background:#DCE2E6; }
        .sa-test-segments span.is-done { background:#607B73; }
        .sa-test-segments span.is-current { background:#B4B456; }
        .sa-score { display:flex; align-items:center; justify-content:space-between; margin:0 16px 12px; padding:10px 12px; border:1px solid #E7E8D4; border-radius:11px; background:#FAFAF0; }
        .sa-score small { display:block; color:#77795B; font-size:10px; font-weight:700; }
        .sa-score strong { display:block; margin-top:2px; color:#3F4A36; font-size:20px; font-weight:900; }
        .sa-score svg { color:#8A8C4C; }
        .sa-test-footer { display:flex; justify-content:space-between; gap:8px; margin:0 16px; padding:11px 0 0; border-top:1px solid #EEF0F1; color:#82909B; font-size:10px; font-weight:700; }
        .sa-test-footer span { display:flex; align-items:center; gap:5px; }
        .sa-start {
          display:flex; align-items:center; justify-content:center; gap:8px; width:calc(100% - 32px); min-height:41px;
          margin:13px 16px 16px; border:1px solid var(--sa-ink); border-radius:11px; color:#fff;
          background:var(--sa-ink); font-family:inherit; font-size:13px; font-weight:800; cursor:pointer;
          transition:background .16s ease,color .16s ease,transform .16s ease;
        }
        .sa-start:hover { color:var(--sa-ink); background:var(--sa-signal); transform:translateY(-1px); }
        .sa-break {
          position:relative; display:grid; place-items:center; min-height:calc(100dvh - 66px); overflow:hidden;
          padding:36px 18px; background:
            radial-gradient(ellipse at 50% 12%, rgba(247,247,117,.22), transparent 27rem),
            linear-gradient(145deg,#E9EEF0 0%,#F7F8FA 54%,#E8ECEB 100%);
        }
        .sa-break::before,.sa-break::after { content:""; position:absolute; border:1px solid rgba(13,27,42,.065); border-radius:50%; pointer-events:none; }
        .sa-break::before { width:470px; height:470px; top:-285px; inset-inline-start:-165px; }
        .sa-break::after { width:650px; height:650px; bottom:-495px; inset-inline-end:-190px; }
        .sa-break-card {
          position:relative; z-index:1; display:grid; grid-template-columns:1fr 190px; width:min(760px,100%);
          overflow:hidden; border:1px solid #DCE2E4; border-radius:23px; background:#fff;
          box-shadow:0 24px 65px rgba(13,27,42,.11);
          animation:sa-arrive .42s cubic-bezier(.2,.75,.3,1) both;
        }
        @keyframes sa-arrive { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .sa-break-main { padding:32px clamp(22px,4vw,42px) 30px; }
        .sa-break-kicker { display:flex; align-items:center; gap:8px; color:#657688; font-size:12px; font-weight:800; }
        .sa-break-kicker span { display:inline-block; width:7px; height:7px; border-radius:50%; background:#92984D; }
        .sa-break-title { margin:17px 0 8px; color:var(--sa-ink); font-size:clamp(25px,4vw,34px); line-height:1.2; font-weight:900; letter-spacing:-.035em; }
        .sa-break-description { margin:0; color:#677585; font-size:15px; line-height:1.8; }
        .sa-handoff { display:flex; align-items:center; gap:12px; margin-top:24px; padding:13px 15px; border:1px solid #E5E8E8; border-radius:13px; background:#F7F8F7; }
        .sa-handoff-step { flex:1; min-width:0; }
        .sa-handoff-step small { display:block; color:#87919A; font-size:10px; font-weight:700; }
        .sa-handoff-step strong { display:block; margin-top:3px; color:#344657; font-size:13px; font-weight:900; }
        .sa-handoff-arrow { color:#89949D; }
        .sa-break-action {
          display:flex; align-items:center; justify-content:center; gap:8px; width:100%; min-height:47px;
          margin-top:22px; border:0; border-radius:12px; color:#fff; background:var(--sa-ink);
          font-family:inherit; font-size:14px; font-weight:800; cursor:pointer; transition:background .18s ease,transform .18s ease;
        }
        .sa-break-action:hover { color:var(--sa-ink); background:var(--sa-signal); transform:translateY(-1px); }
        .sa-auto-copy { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:16px; color:#788590; font-size:12px; font-weight:700; }
        .sa-auto-copy strong { color:#374A5B; font-variant-numeric:tabular-nums; font-size:13px; }
        .sa-auto-track { height:5px; overflow:hidden; margin-top:8px; border-radius:99px; background:#E8ECEE; direction:ltr; }
        .sa-auto-track span { display:block; height:100%; border-radius:inherit; background:#89914B; transition:width 1s linear; }
        .sa-break-aside {
          display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100%;
          padding:22px 14px; border-inline-start:1px solid #E7EAEB; background:#F7F8F6; text-align:center;
        }
        .sa-rest-mark { display:grid; place-items:center; width:52px; height:52px; margin-bottom:13px; border-radius:17px; color:#475C68; background:#E8ECE9; }
        .sa-rest-label { color:#77838A; font-size:11px; font-weight:800; }
        .sa-timer { margin:7px 0 2px; color:var(--sa-ink); font-size:43px; line-height:1; font-weight:900; font-variant-numeric:tabular-nums; letter-spacing:-.055em; }
        .sa-timer-unit { color:#8B969D; font-size:11px; font-weight:700; }
        .sa-aside-note { max-width:140px; margin:19px 0 0; color:#839097; font-size:11px; line-height:1.6; }
        @media (max-width:850px) {
          .sa-intro { padding:22px; }
          .sa-topics { grid-template-columns:repeat(3,minmax(0,1fr)); }
          .sa-test-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
        @media (max-width:600px) {
          .sa-topbar { min-height:60px; padding:9px 13px; }
          .sa-brand-copy span { display:none; }
          .sa-preview-switch button { min-height:34px; padding:0 9px; font-size:11px; }
          .sa-preview-switch button svg { display:none; }
          .sa-bank { padding:17px 13px 32px; }
          .sa-intro { grid-template-columns:1fr; gap:15px; padding:20px 18px; border-radius:16px; }
          .sa-intro p { font-size:14px; }
          .sa-account { width:100%; padding:12px 13px; }
          .sa-account p { margin-bottom:8px; }
          .sa-metrics { grid-template-columns:repeat(2,minmax(0,1fr)); margin:14px 0 19px; padding:8px 4px; }
          .sa-metric { justify-content:flex-start; padding:8px 10px; }
          .sa-metric:nth-child(2)::after { display:none; }
          .sa-metric:nth-child(-n+2) { border-bottom:1px solid #E7EAEC; }
          .sa-category-tabs { width:100%; justify-content:stretch; gap:2px; padding:4px; margin-bottom:19px; }
          .sa-category-tabs button { flex:1; min-height:40px; gap:5px; padding:0 5px; font-size:11px; }
          .sa-category-tabs button svg { width:14px; height:14px; }
          .sa-section-heading h2 { font-size:15px; }
          .sa-topics { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-bottom:18px; }
          .sa-topic { min-height:94px; gap:8px; padding:11px; }
          .sa-topic-title { font-size:12px; }
          .sa-test-grid { grid-template-columns:1fr; gap:11px; }
          .sa-test-card { border-radius:14px; }
          .sa-break { min-height:calc(100dvh - 60px); padding:22px 13px; }
          .sa-break-card { grid-template-columns:1fr; border-radius:18px; }
          .sa-break-main { padding:24px 20px 22px; }
          .sa-break-aside { grid-row:1; flex-direction:row; gap:13px; min-height:auto; padding:15px 19px; border-inline-start:0; border-bottom:1px solid #E7EAEB; text-align:right; }
          .sa-rest-mark { width:41px; height:41px; margin:0; border-radius:13px; }
          .sa-rest-label { display:none; }
          .sa-timer { margin:0; font-size:31px; }
          .sa-timer-unit { margin-inline-start:auto; }
          .sa-aside-note { max-width:none; margin:0; font-size:10px; }
          .sa-break-title { margin-top:13px; }
          .sa-handoff { gap:8px; padding:11px; }
          .sa-handoff-step strong { font-size:12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sa-shell *, .sa-shell *::before, .sa-shell *::after { scroll-behavior:auto !important; animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; }
        }
      `}</style>

      <header className="sa-topbar">
        <div className="sa-brand" aria-label="قدراتك">
          <span className="sa-brand-mark" aria-hidden="true">ق</span>
          <span className="sa-brand-copy">
            <strong>قدراتك</strong>
            <span>استعد بثقة، خطوة بخطوة</span>
          </span>
        </div>
        <nav className="sa-preview-switch" aria-label="حالة معاينة بنك الأسئلة">
          <button type="button" aria-pressed={previewState === "bank"} onClick={() => setPreviewState("bank")}>
            <BookOpen size={15} aria-hidden="true" /> بنك الاختبارات
          </button>
          <button type="button" aria-pressed={previewState === "break"} onClick={openBreak}>
            <Clock3 size={15} aria-hidden="true" /> الاستراحة
          </button>
        </nav>
      </header>

      {previewState === "bank" ? (
        <main className="sa-bank">
          <section className="sa-intro" aria-labelledby="sa-bank-title">
            <div>
              <div className="sa-eyebrow"><span className="sa-eyebrow-mark" /> مساحة تدريبك</div>
              <h1 id="sa-bank-title">بنك الأسئلة</h1>
              <p>مجموعة شاملة من الأسئلة الأصلية مقسمة إلى اختبارات متدرجة لضمان التحضير الأمثل</p>
            </div>
            <aside className="sa-account" aria-label="حد الاختبارات اليومي">
              <div className="sa-account-head"><Users size={15} aria-hidden="true" /> حساب مجاني</div>
              <p>اختبار واحد متبقٍ اليوم</p>
              <div className="sa-limit-track" role="progressbar" aria-label="الاستخدام اليومي" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
                <span />
              </div>
            </aside>
          </section>

          <section className="sa-metrics" aria-label="ملخص بنك الأسئلة">
            <div className="sa-metric"><span className="sa-metric-icon"><BookOpen size={17} aria-hidden="true" /></span><div><strong>1,240</strong><span>إجمالي الأسئلة</span></div></div>
            <div className="sa-metric"><span className="sa-metric-icon"><Layers3 size={17} aria-hidden="true" /></span><div><strong>42</strong><span>عدد الاختبارات</span></div></div>
            <div className="sa-metric"><span className="sa-metric-icon"><CheckCircle2 size={17} aria-hidden="true" /></span><div><strong>12</strong><span>مكتمل</span></div></div>
            <div className="sa-metric"><span className="sa-metric-icon"><Trophy size={17} aria-hidden="true" /></span><div><strong>72%</strong><span>متوسط النتائج</span></div></div>
          </section>

          <section className="sa-content" aria-label="الاختبارات حسب القسم">
            <div className="sa-category-tabs" role="tablist" aria-label="أقسام الاختبار">
              {categories.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={category === id}
                  aria-controls="sa-question-bank-panel"
                  onClick={() => { setCategory(id); setSelectedTopic(null); }}
                >
                  <Icon size={16} aria-hidden="true" /> {label}
                </button>
              ))}
            </div>

            <div id="sa-question-bank-panel" role="tabpanel" aria-label={categories.find((item) => item.id === category)?.label}>
              <div className="sa-section-heading">
                <div><h2>موضوعات القسم {categoryNames[category]}</h2><p>اختر موضوعًا لتصفية الاختبارات المرتبطة به</p></div>
                {selectedTopic && <button className="sa-clear-filter" type="button" onClick={() => setSelectedTopic(null)}>إلغاء الفلتر</button>}
              </div>
              <div className="sa-topics">
                {currentTopics.map(({ title, count, Icon }) => (
                  <button
                    className="sa-topic"
                    key={title}
                    type="button"
                    aria-pressed={selectedTopic === title}
                    onClick={() => setSelectedTopic(selectedTopic === title ? null : title)}
                  >
                    <span className="sa-topic-icon"><Icon size={17} aria-hidden="true" /></span>
                    <span className="sa-topic-title">{title}</span>
                    <span className="sa-topic-count">{count} سؤال</span>
                    {selectedTopic === title && <Check size={14} aria-label="محدد" />}
                  </button>
                ))}
              </div>

              <div className="sa-progress-panel" aria-label={`تقدم الاختبارات ${overallProgress}%`}>
                <div className="sa-progress-top"><span>تقدم الاختبارات {categoryNames[category]}</span><span>{overallProgress}%</span></div>
                <div className="sa-progress-track" role="progressbar" aria-label="تقدم الاختبارات" aria-valuenow={overallProgress} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${overallProgress}%` }} />
                </div>
              </div>

              <div className="sa-test-grid">
                {tests.map((test) => {
                  const inProgress = !test.completed && test.progress > 0;
                  const duration = category === "standard" ? "120 دقيقة" : "50 دقيقة";
                  return (
                    <article className="sa-test-card" key={test.number}>
                      <div className="sa-test-card-top">
                        <div className="sa-test-name">
                          <span className="sa-test-icon"><BookOpen size={19} aria-hidden="true" /></span>
                          <div>
                            <h3>اختبار {test.number}</h3>
                            <div className="sa-test-meta">
                              <span><Layers3 size={12} aria-hidden="true" /> 5 أقسام</span>
                              <span><Clock3 size={12} aria-hidden="true" /> {duration}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`sa-status${test.completed ? "" : inProgress ? " is-progress" : " is-ready"}`}>
                          {test.completed ? <><CheckCircle2 size={12} aria-hidden="true" /> مكتمل</> : inProgress ? "قيد التقدم" : "جديد"}
                        </span>
                      </div>
                      <div className="sa-test-progress">
                        <div className="sa-test-progress-head">
                          <span>أقسام الاختبار ({category === "standard" ? "120" : "50"} سؤال)</span>
                          <strong>{test.completed ? "مكتمل 5/5" : inProgress ? "القسم 2 من 5" : "5 أقسام"}</strong>
                        </div>
                        <div className="sa-test-segments" aria-label={test.completed ? "خمسة أقسام مكتملة" : `${Math.floor(test.progress / 20)} من 5 أقسام`}>
                          {Array.from({ length: 5 }, (_, index) => (
                            <span key={index} className={test.completed || index < 1 && inProgress ? "is-done" : index === 1 && inProgress ? "is-current" : ""} />
                          ))}
                        </div>
                      </div>
                      {test.completed && (
                        <div className="sa-score">
                          <div><small>النتيجة الحالية</small><strong>{test.score}%</strong></div>
                          <Trophy size={22} aria-hidden="true" />
                        </div>
                      )}
                      <div className="sa-test-footer">
                        <span><Clock3 size={12} aria-hidden="true" /> {duration}</span>
                        <span><Layers3 size={12} aria-hidden="true" /> نظام الأقسام الجديد</span>
                      </div>
                      <button className="sa-start" type="button" onClick={openBreak}>
                        {test.completed ? <RotateCcw size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
                        {test.completed ? "إعادة المحاولة" : inProgress ? "متابعة الاختبار" : "بدء الاختبار"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main className="sa-break">
          <article className="sa-break-card" aria-labelledby="sa-break-title">
            <section className="sa-break-main">
              <div className="sa-break-kicker"><span /> وقت قصير لاستعادة التركيز</div>
              <h1 className="sa-break-title" id="sa-break-title">استراحة بين الأقسام</h1>
              <p className="sa-break-description">أنهيت القسم {nextSection - 1}، خذ نفسًا عميقًا واستعد للقسم القادم.</p>
              <div className="sa-handoff" aria-label={`القسم ${nextSection - 1} مكتمل، القسم ${nextSection} التالي`}>
                <div className="sa-handoff-step"><small>تم إنجازه</small><strong>القسم {nextSection - 1} <CheckCircle2 size={13} aria-hidden="true" /></strong></div>
                <span className="sa-handoff-arrow" aria-hidden="true">←</span>
                <div className="sa-handoff-step"><small>التالي</small><strong>القسم {nextSection}</strong></div>
              </div>
              <button className="sa-break-action" type="button" onClick={continueNow}>
                <SkipForward size={17} aria-hidden="true" /> تخطي الاستراحة والمتابعة
              </button>
              <div className="sa-auto-copy">
                <span>أو انتظر للمتابعة تلقائيًا</span>
                <strong aria-live="off">{formatTime(breakTimeLeft)}</strong>
              </div>
              <div className="sa-auto-track" role="progressbar" aria-label={`الوقت المنقضي من الاستراحة ${30 - breakTimeLeft} ثانية`} aria-valuenow={30 - breakTimeLeft} aria-valuemin={0} aria-valuemax={30}>
                <span style={{ width: `${((30 - breakTimeLeft) / 30) * 100}%` }} />
              </div>
            </section>
            <aside className="sa-break-aside" aria-label="مؤقت الاستراحة">
              <span className="sa-rest-mark"><Clock3 size={23} aria-hidden="true" /></span>
              <span className="sa-rest-label">الوقت المتبقي</span>
              <strong className="sa-timer" aria-live="polite">{formatTime(breakTimeLeft)}</strong>
              <span className="sa-timer-unit">من 00:30</span>
              <p className="sa-aside-note">المتابعة تلقائية عند انتهاء المؤقت</p>
            </aside>
          </article>
        </main>
      )}
    </div>
  );
}