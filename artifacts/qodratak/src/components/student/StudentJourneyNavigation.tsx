import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const STEPS = [
  { href: "/foundation", label: "التأسيس", match: ["/foundation"] },
  { href: "/learning/today", label: "تدريب موجّه", match: ["/learning/today"] },
  { href: "/computerized", label: "التدريب", match: ["/computerized"] },
  { href: "/records", label: "تقاريري", match: ["/records"] },
];

export function StudentJourneyNavigation() {
  const [location] = useLocation();
  const path = location.split("?")[0].replace(/\/+$/, "") || "/";
  return (
    <nav aria-label="رحلة التحضير" dir="rtl" data-testid="nav-student-journey" className="border-b border-border bg-card/80">
      <ol className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2">
        {STEPS.map((step, i) => {
          const active = step.match.some((m) => path === m || path.startsWith(`${m}/`));
          return (
            <li key={step.href} className="shrink-0">
              <Link
                href={step.href}
                aria-current={active ? "page" : undefined}
                data-testid={`link-journey-${step.href.slice(1).replace("/", "-")}`}
                className={cn(
                  "flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-bold transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black", active ? "bg-primary-foreground/20" : "bg-muted")}>{i + 1}</span>
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default StudentJourneyNavigation;
