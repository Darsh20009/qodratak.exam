import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Download, FileSignature, FileUp, Loader2, RefreshCw } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { TYPE_LABEL, portalDownloadPdf, portalLookup, portalUploadSigned, type ContractPortalInfo } from "@/lib/institutionApi";

function readToken() {
  const hash = window.location.hash.replace(/^#/, "");
  return new URLSearchParams(hash).get("token") || "";
}

export default function InstitutionContractPortalPage() {
  const [token] = useState(readToken);
  const [info, setInfo] = useState<ContractPortalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [signerName, setSignerName] = useState("");
  const [consent, setConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [doneMessage, setDoneMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!token) { setLoadError("رابط العقد غير مكتمل. افتح الرابط كما وصلك دون تعديل."); setLoading(false); return; }
    setLoading(true); setLoadError("");
    try { setInfo(await portalLookup(token)); }
    catch (e) { setLoadError((e as Error).message || "تعذر فتح رابط العقد"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (f: File | null) => {
    setUploadError("");
    if (!f) return setFile(null);
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) { setUploadError("الملف يجب أن يكون بصيغة PDF."); return; }
    if (f.size > 12 * 1024 * 1024) { setUploadError("الحد الأقصى لحجم الملف 12 ميجابايت."); return; }
    setFile(f);
  };

  const download = async () => {
    if (!info) return;
    setDownloading(true); setDownloadError("");
    try { await portalDownloadPdf(token, info.reference); }
    catch (e) { setDownloadError((e as Error).message); }
    finally { setDownloading(false); }
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info || !file) return;
    if (signerName.trim().split(/\s+/).length < 2) { setUploadError("أدخل الاسم الثنائي للمفوّض بالتوقيع."); return; }
    if (!consent) { setUploadError("يلزم الإقرار قبل الرفع."); return; }
    setUploading(true); setUploadError("");
    try {
      const r = await portalUploadSigned(token, file, info.reference, signerName.trim());
      setDoneMessage(r.message || "استلمنا النسخة الموقعة وهي الآن بانتظار مراجعة إدارة المنصة.");
      setInfo({ ...info, submitted: true, canUpload: false });
    } catch (err) { setUploadError((err as Error).message || "تعذر رفع الملف. حاول مرة أخرى."); }
    finally { setUploading(false); }
  };

  const inst = info?.institution;
  const card = "rounded-2xl border border-border bg-card p-5 text-card-foreground";

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-background px-4 py-8 text-foreground">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <header className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-xs font-bold text-muted-foreground">منصة قدراتك التعليمية</p>
            <h1 className="text-xl font-black">بوابة عقد المؤسسة</h1>
          </div>
        </header>

        {loading ? (
          <div className={card}><div className="space-y-3"><div className="h-5 w-1/2 animate-pulse rounded bg-muted" /><div className="h-4 w-3/4 animate-pulse rounded bg-muted" /><div className="h-24 animate-pulse rounded-xl bg-muted" /></div></div>
        ) : loadError || !info || !inst ? (
          <div className={card} data-testid="status-portal-error">
            <p className="flex items-center gap-2 font-black"><AlertTriangle className="h-5 w-5 text-destructive" /> تعذر فتح العقد</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{loadError || "الرابط غير صالح أو منتهي الصلاحية. تواصل مع إدارة المنصة لطلب رابط جديد."}</p>
            {token && <button data-testid="button-portal-retry" onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-bold"><RefreshCw className="h-4 w-4" /> إعادة المحاولة</button>}
          </div>
        ) : (
          <>
            <section className={card}>
              <p className="text-xs font-bold text-muted-foreground">الطرف الثاني</p>
              <h2 data-testid="text-portal-institution" className="mt-1 text-lg font-black">{inst.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{TYPE_LABEL[inst.type]}{inst.city ? ` · ${inst.city}` : ""}</p>
              <p className="mt-3 text-xs text-muted-foreground">الرقم المرجعي</p>
              <p dir="ltr" data-testid="text-portal-reference" className="break-all text-right font-mono text-xs">{info.reference}</p>
              {info.ownerAccountPending && (
                <p className="mt-3 rounded-xl bg-muted p-3 text-xs leading-6 text-muted-foreground">حساب مالك المؤسسة جاهز للدخول برقم الجوال ورمز التحقق، وتبقى صلاحيات المؤسسة مغلقة حتى اعتماد العقد.</p>
              )}
            </section>

            <section className={card}>
              <p className="flex items-center gap-2 font-black"><FileSignature className="h-5 w-5 text-primary" /> 1. نزّل العقد ووقّعه</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">اطبع العقد، ووقّعه واختمه من المفوّض، ثم امسحه ضوئيًا بصيغة PDF.</p>
              {info.documentReady ? (
                <button data-testid="button-portal-download" onClick={download} disabled={downloading} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground disabled:opacity-50">
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} تنزيل العقد PDF
                </button>
              ) : <p className="mt-3 text-sm font-bold text-muted-foreground">ملف العقد غير جاهز بعد. أعد فتح الرابط لاحقًا.</p>}
              {downloadError && <p className="mt-2 text-xs font-bold text-destructive">{downloadError}</p>}
            </section>

            {info.submitted ? (
              <section className={card} data-testid="status-portal-submitted">
                <p className="flex items-center gap-2 font-black"><Clock3 className="h-5 w-5 text-primary" /> {inst.contract?.status === "approved" ? "تم اعتماد العقد" : "النسخة الموقعة بانتظار المراجعة"}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{inst.contract?.status === "approved"
                  ? "راجعت الإدارة العقد واعتمدته. يمكنك متابعة حساب المؤسسة؛ الوصول يتبع حالة المؤسسة وصلاحيات حسابك."
                  : `${doneMessage || "استلمت إدارة المنصة النسخة الموقعة."} لا تُفعّل المؤسسة تلقائيًا؛ سيصلك إشعار عند اعتماد العقد وفتح الصلاحيات.`}</p>
                {doneMessage && <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-primary"><CheckCircle2 className="h-4 w-4" /> تم الرفع</p>}
              </section>
            ) : info.canUpload ? (
              <form onSubmit={upload} className={card}>
                <p className="flex items-center gap-2 font-black"><FileUp className="h-5 w-5 text-primary" /> 2. ارفع النسخة الموقعة</p>
                <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
                <button type="button" data-testid="button-portal-pick" onClick={() => fileRef.current?.click()} className="mt-3 w-full rounded-xl border border-dashed border-border px-4 py-4 text-sm font-bold text-muted-foreground hover:border-primary">
                  {file ? `${file.name} · ${(file.size / 1048576).toFixed(2)} MB` : "اختر ملف PDF (حتى 12 ميجابايت)"}
                </button>
                <label className="mt-4 block text-xs font-bold text-muted-foreground">اسم المفوّض بالتوقيع</label>
                <input data-testid="input-portal-signer" value={signerName} onChange={(e) => setSignerName(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                <label className="mt-4 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
                  <input data-testid="checkbox-portal-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" />
                  أقر بأنني مفوّض بالتوقيع عن المؤسسة، وأن الملف المرفوع هو العقد ذو الرقم المرجعي نفسه بعد توقيعه دون تعديل في محتواه.
                </label>
                {uploadError && <p data-testid="text-portal-upload-error" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-bold text-destructive">{uploadError}</p>}
                <button data-testid="button-portal-upload" disabled={!file || !consent || uploading} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground disabled:opacity-50">
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />} رفع للمراجعة
                </button>
              </form>
            ) : (
              <section className={card}><p className="text-sm leading-7 text-muted-foreground">الرفع غير متاح لهذا العقد حاليًا. تواصل مع إدارة المنصة.</p></section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
