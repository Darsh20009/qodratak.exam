import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={showLabel ? "sm" : "icon"}
        className="relative"
        data-testid="button-theme-toggle-loading"
      >
        <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
        {showLabel && <span className="h-3 w-16 animate-pulse rounded bg-muted" />}
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative overflow-visible group ${showLabel ? "gap-2 px-3" : ""}`}
      data-testid="button-theme-toggle"
      aria-label={isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
      title={isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
    >
      <Sun
        className={`h-5 w-5 transition-all duration-300 ${
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-300 ${
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
      />
      {showLabel ? (
        <span className="text-xs font-semibold">
          {isDark ? "الوضع النهاري" : "الوضع الليلي"}
        </span>
      ) : (
        <span className="sr-only">
          {isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
        </span>
      )}
    </Button>
  );
}

export default ThemeToggle;
