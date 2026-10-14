import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { X, AlertTriangle, CheckCircle, Send, Loader2, CircleSlash, PenLine, HelpCircle, ImageOff, FileText } from "lucide-react";
import { jsonRequest } from "@/lib/questionContributions";

interface Props {
  question: {
    id: number | string;
    text: string;
    options: string[];
    correctOptionIndex: number | null;
    sourceType?: string;
    sourceQuestionId?: number | string;
  };
  onClose: () => void;
}

const REPORT_TYPES = [
  { value: "wrong_answer", label: "الإجابة الصحيحة خاطئة", Icon: CircleSlash, desc: "الإجابة المحددة كصحيحة ليست صحيحة فعلًا" },
  { value: "typo", label: "خطأ إملائي أو لغوي", Icon: PenLine, desc: "خطأ في كتابة السؤال أو الخيارات" },
  { value: "unclear", label: "السؤال غير واضح", Icon: HelpCircle, desc: "مبهم أو يحتمل أكثر من تفسير" },
  { value: "missing_image", label: "صورة ناقصة", Icon: ImageOff, desc: "السؤال يحتاج شكلًا أو صورة غير ظاهرة" },
  { value: "other", label: "سبب آخر", Icon: FileText, desc: "مشكلة أخرى في السؤال" },
] as const;

export default function QuestionReportModal({ question, onClose }: Props) {
  const [type, setType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const loadingRef = useRef(false);
  loadingRef.current = loading;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loadingRef.current) onCloseRef.current();
      if (e.key === "Tab" && dialogRef.current) {
        const items = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])');
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); previous?.focus?.(); };
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => onCloseRef.current(), 2500);
    return () => clearTimeout(t);
  }, [success]);

  const handleSubmit = async () => {
    setError("");
    if (!type) return setError("اختر نوع المشكلة.");
    if (!description.trim()) return setError("اكتب وصفًا مختصرًا للمشكلة.");
    setLoading(true);
    try {
      const res = await jsonRequest<{ notificationStatus?: string }>("POST", "/api/questions/report", {
        questionId: question.id,
        sourceType: question.sourceType,
        sourceQuestionId: question.sourceQuestionId,
        questionText: question.text,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        reportType: type,
        description: description.trim(),
      });
      setNotice(res?.notificationStatus === 'queued' ? 'البلاغ محفوظ، وتنبيه الإدارة في قائمة الإرسال ولم يتأكد وصوله بعد.' : res?.notificationStatus === 'failed' ? 'البلاغ محفوظ، لكن إرسال تنبيه الإدارة فشل؛ سيظهر في قائمة المراجعة.' : 'البلاغ محفوظ وسيراجعه الفريق.');
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر إرسال البلاغ.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm" dir="rtl" onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="report-modal-title" className="w-full max-w-md max-h-[92dvh] overflow-y-auto bg-background text-right rounded-3xl border border-border shadow-2xl">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden />
          </div>
          <div className="flex-1">
            <h3 id="report-modal-title" className="text-sm font-black text-foreground">إبلاغ عن خطأ في السؤال</h3>
            <p className="text-xs text-muted-foreground">يراجعه فريق المحتوى يدويًا</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} disabled={loading} aria-label="إغلاق" className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500" data-testid="button-close-report">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3" role="status">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" aria-hidden />
            </div>
            <h4 className="text-sm font-black text-foreground">تم إرسال البلاغ</h4>
            <p className="text-xs text-muted-foreground">{notice}</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground mb-1">السؤال:</p>
              <p className="text-xs text-foreground leading-relaxed line-clamp-3">{question.text}</p>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-muted-foreground mb-2">نوع المشكلة:</legend>
              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
                {REPORT_TYPES.map(({ value, label, desc, Icon }) => (
                  <button key={value} type="button" aria-pressed={type === value} onClick={() => setType(value)}
                    className={cn("flex flex-col items-start gap-1 p-3 rounded-xl border text-right transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                      type === value ? "border-amber-500 bg-amber-500/10" : "border-border bg-muted/20 hover:bg-muted/40")}
                    data-testid={`report-type-${value}`}>
                    <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden />
                    <span className="text-xs font-bold text-foreground leading-tight">{label}</span>
                    <span className="text-[11px] text-muted-foreground leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="space-y-1.5">
              <label htmlFor="report-description" className="text-xs font-semibold text-muted-foreground">وصف المشكلة (مطلوب):</label>
              <textarea id="report-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="اشرح المشكلة بشكل أوضح..." rows={3}
                className="w-full text-sm bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors resize-none"
                data-testid="report-description" />
            </div>
            {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive" data-testid="text-report-error">{error}</p>}
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-600 text-white text-sm font-black hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              data-testid="btn-submit-report">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "جارٍ الإرسال..." : "إرسال البلاغ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
