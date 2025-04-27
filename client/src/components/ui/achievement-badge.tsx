import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AchievementBadgeProps {
  name: string;
  description: string;
  icon: ReactNode;
  variant?: "default" | "outline" | "success" | "warning" | "danger" | "locked";
  size?: "sm" | "md" | "lg";
  className?: string;
  locked?: boolean;
}

export function AchievementBadge({
  name,
  description,
  icon,
  variant = "default",
  size = "md",
  className,
  locked = false,
}: AchievementBadgeProps) {
  const variants = {
    default: "bg-primary/10 border-primary/50 text-primary",
    outline: "bg-background border-border text-foreground",
    success: "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400",
    warning: "bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-400",
    danger: "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400",
    locked: "bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-500",
  };

  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const finalVariant = locked ? "locked" : variant;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex flex-col items-center justify-center border-2 rounded-full relative cursor-help",
              variants[finalVariant],
              sizes[size],
              className
            )}
          >
            <div className={cn("opacity-100", locked && "opacity-50")}>
              {icon}
            </div>
            {locked && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 dark:bg-background/80 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="font-medium">{name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {locked ? "مغلق - أكمل التحديات المطلوبة لفتح هذا الإنجاز" : description}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}