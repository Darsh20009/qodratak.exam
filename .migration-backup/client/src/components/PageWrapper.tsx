import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  noPadding?: boolean;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-full",
};

export function PageWrapper({
  children,
  className,
  maxWidth = "xl",
  noPadding = false,
}: PageWrapperProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto",
        maxWidthMap[maxWidth],
        !noPadding && "px-4 py-5 pb-24 md:pb-8 sm:px-6",
        className
      )}
      dir="rtl"
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconBg?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon,
  title,
  subtitle,
  iconBg = "from-blue-500 to-teal-500",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mb-6", className)}>
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={cn(
            "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md flex-shrink-0",
            iconBg
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-0.5 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}

export function SectionCard({
  children,
  className,
  title,
  icon,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl border border-border shadow-sm overflow-hidden",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            {title && <h2 className="font-semibold text-foreground text-sm">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
