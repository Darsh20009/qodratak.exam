import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type BookingMode = "undecided" | "booked" | "open";

interface CourseStartGuideProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  bookingMode: BookingMode;
  onBookingModeChange: (mode: "booked" | "open") => void;
  showBookingChoice: boolean;
}

const SECTIONS = [
  { title: "الكمي", body: "العلاقات العددية والنسب والهندسة وحل المسائل." },
  { title: "اللفظي", body: "فهم النصوص والمعاني، والتناظر، وإكمال الجمل، والخطأ السياقي." },
];

const STEPS = [
  { title: "التقييم", body: "تقدير أولي لمستواك، وليس درجة رسمية، ولا يُبنى حكم على إجابة واحدة." },
  { title: "التأسيس", body: "تتعلم المفهوم مع مثال محلول." },
  { title: "التدريب", body: "تجرّب بنفسك أولًا، ثم تراجع تصحيحًا موثوقًا مع الشرح." },
  { title: "المحاكاة", body: "تتدرب على إدارة الوقت." },
  { title: "السجلات", body: "تحفظ أخطاءك وزمن كل سؤال لتراجعها لاحقًا." },
];

export function CourseStartGuide({ expanded, onExpandedChange, bookingMode, onBookingModeChange, showBookingChoice }: CourseStartGuideProps) {
  const choice = (mode: "booked" | "open", label: string) => (
    <button
      type="button"
      aria-pressed={bookingMode === mode}
      onClick={() => onBookingModeChange(mode)}
      data-testid={`button-booking-${mode}`}
      className={`min-h-12 rounded-xl border px-3 text-sm font-black transition-colors ${bookingMode === mode ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}
    >
      {label}
    </button>
  );

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-7" dir="rtl" aria-labelledby="intro-guide-title" data-testid="intro-course-guide">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-primary">قبل أن تبدأ</p>
          <h2 id="intro-guide-title" className="mt-1 text-xl font-black text-foreground">كيف تسير الرحلة</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 shrink-0 rounded-xl font-bold"
          aria-expanded={expanded}
          aria-controls="intro-guide-body"
          onClick={() => onExpandedChange(!expanded)}
          data-testid="button-toggle-intro"
        >
          {expanded ? "إخفاء الشرح" : "عرض الشرح"}
          <ChevronDown className={`mr-2 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
        </Button>
      </div>

      <div id="intro-guide-body" hidden={!expanded} className="mt-5 space-y-5">
        <p className="text-sm leading-7 text-muted-foreground">في تدريبات القدرات هنا، تقرأ السؤال وتختار إجابة واحدة من الخيارات. الهدف أن تفهم طريقة الوصول للحل، لا أن تحفظ الإجابة. جرّب بنفسك، ثم راجع التصحيح بعد التسليم. المحاكاة تدريب على الوقت وليست الاختبار الرسمي.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <div key={s.title} className="rounded-2xl bg-muted/50 p-4">
              <h3 className="text-sm font-black text-foreground">{s.title}</h3>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary" aria-hidden="true">{i + 1}</span>
              <p className="text-sm leading-7 text-muted-foreground"><span className="font-black text-foreground">{s.title}: </span>{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="text-xs leading-6 text-muted-foreground">الخطة مساعدة للتدريب، ولا تعد بنتيجة معينة.</p>
      </div>

      {showBookingChoice && (
        <fieldset className="mt-5 border-t border-border pt-5">
          <legend className="text-sm font-black text-foreground">هل حجزت موعد اختبارك؟</legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {choice("booked", "حجزت اختباري")}
            {choice("open", "لم أحجز بعد")}
          </div>
          {bookingMode === "open" && (
            <p className="mt-3 text-sm leading-7 text-muted-foreground" data-testid="text-booking-open-note">
              لا مشكلة. تبدأ بالتأسيس والتدريب دون تاريخ اختبار. تظهر خطة بمواعيد فعلية بعد أن تحجز موعدًا حقيقيًا.
            </p>
          )}
        </fieldset>
      )}
    </section>
  );
}
