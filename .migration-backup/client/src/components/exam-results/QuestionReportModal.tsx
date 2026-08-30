import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, AlertTriangle, CheckCircle, Send, Loader2 } from "lucide-react";

interface Props {
  question: {
    id: number | string;
    text: string;
    options: string[];
    correctOptionIndex: number;
  };
  onClose: () => void;
}

const REPORT_TYPES = [
  { value: "wrong_answer", label: "الإجابة الصحيحة خاطئة", icon: "❌", desc: "الإجابة المحددة كصحيحة ليست صحيحة فعلاً" },
  { value: "typo", label: "خطأ إملائي أو لغوي", icon: "✏️", desc: "يوجد خطأ في كتابة السؤال أو الخيارات" },
  { value: "unclear", label: "السؤال غير واضح", icon: "❓", desc: "السؤال مبهم أو يحتمل أكثر من تفسير" },
  { value: "other", label: "سبب آخر", icon: "📝", desc: "مشكلة أخرى في السؤال" },
] as const;

export default function QuestionReportModal({ question, onClose }: Props) {
  const [type, setType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!type) return;
    setLoading(true);
    try {
      const res = await fetch("/api/questions/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          questionText: question.text,
          options: question.options,
          correctOptionIndex: question.correctOptionIndex,
          reportType: type,
          description: description.trim(),
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(onClose, 2500);
      }
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-background rounded-3xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-foreground">إبلاغ عن خطأ في السؤال</h3>
            <p className="text-[10px] text-muted-foreground">سيتم مراجعة البلاغ وتصحيحه</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <h4 className="text-sm font-black text-foreground">تم إرسال البلاغ بنجاح</h4>
            <p className="text-xs text-muted-foreground">سيراجع المعلم الأمر ويعالجه قريباً</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Question preview */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">السؤال:</p>
              <p className="text-xs text-foreground leading-relaxed line-clamp-3">{question.text}</p>
            </div>

            {/* Report type */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">نوع المشكلة:</p>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_TYPES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setType(r.value)}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 rounded-xl border text-right transition-all duration-150",
                      type === r.value
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    )}
                    data-testid={`report-type-${r.value}`}
                  >
                    <span className="text-base">{r.icon}</span>
                    <span className="text-[11px] font-bold text-foreground leading-tight">{r.label}</span>
                    <span className="text-[9px] text-muted-foreground leading-tight">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">تفاصيل إضافية (اختياري):</p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="اشرح المشكلة بشكل أوضح..."
                rows={3}
                className="w-full text-xs bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors resize-none"
                data-testid="report-description"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!type || loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
              data-testid="btn-submit-report"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? "جارٍ الإرسال..." : "إرسال البلاغ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
