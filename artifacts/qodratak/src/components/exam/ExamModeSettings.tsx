import { Maximize, Monitor, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ExamModeSettingsValue {
  monitored: boolean;
  fullscreen: boolean;
}

interface Props {
  value: ExamModeSettingsValue;
  onChange: (value: ExamModeSettingsValue) => void;
  onStart: () => void;
  isLoading?: boolean;
  startLabel?: string;
}

export async function enterExamDisplayMode(fullscreen: boolean) {
  if (!fullscreen || typeof document === "undefined") return;
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Some browsers require a user gesture or do not support fullscreen.
    }
  }
}

export default function ExamModeSettings({
  value,
  onChange,
  onStart,
  isLoading = false,
  startLabel = "ابدأ الاختبار الآن",
}: Props) {
  const update = (patch: Partial<ExamModeSettingsValue>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <div>
        <p className="text-sm font-black text-foreground">إعدادات تجربة الاختبار</p>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          اختر طريقة التدريب قبل البدء. وضع التدريب لا يراقب تبديل النوافذ، ولا يغيّر تصحيح النتيجة.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => update({ monitored: true })}
          className={`rounded-2xl border p-4 text-right transition ${
            value.monitored
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-foreground hover:border-primary/40"
          }`}
          aria-pressed={value.monitored}
        >
          <span className="flex items-center gap-2 font-black">
            <ShieldCheck className="h-5 w-5" />
            وضع محاكاة ومراقبة
          </span>
          <span className="mt-2 block text-xs leading-5 text-muted-foreground">
            يسجل تنبيهات تبديل التبويب ومحاولات النسخ أثناء المحاكاة.
          </span>
        </button>
        <button
          type="button"
          onClick={() => update({ monitored: false })}
          className={`rounded-2xl border p-4 text-right transition ${
            !value.monitored
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-border bg-background text-foreground hover:border-emerald-500/40"
          }`}
          aria-pressed={!value.monitored}
        >
          <span className="flex items-center gap-2 font-black">
            <Sparkles className="h-5 w-5" />
            وضع تدريب بدون مراقبة
          </span>
          <span className="mt-2 block text-xs leading-5 text-muted-foreground">
            مناسب للتعلم والتجربة، مع بقاء المؤقت وحفظ النتيجة فعالين.
          </span>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => update({ fullscreen: true })}
          className={`flex items-center gap-3 rounded-2xl border p-3 text-right transition ${
            value.fullscreen ? "border-primary bg-primary/10" : "border-border bg-background"
          }`}
          aria-pressed={value.fullscreen}
        >
          <Maximize className="h-5 w-5 text-primary" />
          <span>
            <span className="block text-sm font-black text-foreground">ملء الشاشة</span>
            <span className="block text-xs text-muted-foreground">أفضل للمحاكاة على الكمبيوتر</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => update({ fullscreen: false })}
          className={`flex items-center gap-3 rounded-2xl border p-3 text-right transition ${
            !value.fullscreen ? "border-primary bg-primary/10" : "border-border bg-background"
          }`}
          aria-pressed={!value.fullscreen}
        >
          <Monitor className="h-5 w-5 text-primary" />
          <span>
            <span className="block text-sm font-black text-foreground">داخل النافذة</span>
            <span className="block text-xs text-muted-foreground">يبقى الاختبار داخل صفحة المتصفح</span>
          </span>
        </button>
      </div>

      <Button type="button" onClick={onStart} disabled={isLoading} className="w-full rounded-xl font-black">
        {startLabel}
      </Button>
    </div>
  );
}