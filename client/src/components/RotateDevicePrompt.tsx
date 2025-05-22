
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { PhoneIcon, RotateCcwIcon } from "lucide-react";

export function RotateDevicePrompt() {
  const isMobile = useIsMobile();
  const [showPrompt, setShowPrompt] = useState(false);
  const [orientation, setOrientation] = useState<string>("");

  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setOrientation(isPortrait ? "portrait" : "landscape");
      setShowPrompt(isPortrait && isMobile);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, [isMobile]);

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 max-w-md w-full animate-in fade-in-0 zoom-in-95">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-primary/10 p-3 rounded-full">
            <PhoneIcon className="h-8 w-8 text-primary rotate-90 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold">قم بتدوير جهازك</h2>
          <p className="text-muted-foreground">
            للحصول على أفضل تجربة، يرجى تدوير جهازك إلى الوضع الأفقي
          </p>
          <div className="mt-2">
            <RotateCcwIcon className="h-12 w-12 text-primary animate-spin-slow" />
          </div>
        </div>
      </div>
    </div>
  );
}
