import { useState } from "react";
import { BookOpen, Brain, CalendarCheck, RotateCcw, Zap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  {
    label: "التأسيس",
    description: "ابدأ مسار القدرات أو التحصيلي",
    href: "/foundation",
    icon: BookOpen,
  },
  {
    label: "التدريب والاختبارات",
    description: "اختر اختبارًا أو تدريبًا",
    href: "/training",
    icon: Brain,
  },
  {
    label: "مراجعة الأخطاء",
    description: "راجع الإجابات التي تحتاج تحسينًا",
    href: "/error-analysis",
    icon: RotateCcw,
  },
  {
    label: "الاستعداد للاختبار",
    description: "راجع خطوات يوم الاختبار",
    href: "/pre-exam-day",
    icon: CalendarCheck,
  },
];

export function StudentHeaderTools({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <div className={cn("flex items-center gap-2", className)} dir="rtl">
      <Popover open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="فتح الاختصارات السريعة"
            aria-expanded={shortcutsOpen}
            data-testid="button-student-header-shortcuts"
            title="اختصارات سريعة"
            className="h-10 rounded-xl border-border bg-background px-3 text-xs font-bold text-foreground hover:bg-muted"
          >
            <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className={compact ? "hidden min-[380px]:inline" : undefined}>اختصارات</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={8}
          dir="rtl"
          data-testid="popover-student-header-shortcuts"
          className="w-80 max-w-[calc(100vw-1rem)] rounded-2xl border-border p-3 shadow-xl"
        >
          <div className="mb-3 px-1">
            <h2 className="text-sm font-black text-foreground">اختصارات سريعة</h2>
            <p className="mt-1 text-xs text-muted-foreground">انتقل مباشرة إلى ما تحتاجه.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_LINKS.map(({ label, description, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setShortcutsOpen(false)}
                data-testid={`link-student-header-shortcut-${href.slice(1).replaceAll("/", "-")}`}
                className="flex min-h-20 flex-col items-start justify-center gap-1 rounded-xl border border-border bg-card p-3 text-right transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-2 text-xs font-black text-foreground">
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {label}
                </span>
                <span className="text-[10px] leading-4 text-muted-foreground">{description}</span>
              </Link>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <ThemeToggle showLabel={!compact} />
    </div>
  );
}
