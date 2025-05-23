import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { PhoneIcon } from "lucide-react";

export function RotateDevicePrompt() {
  const isMobile = useIsMobile();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
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
    <div className="fixed inset-0 z-50 bg-background/90 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-lg shadow p-6 max-w-md w-full text-center">
        <div className="bg-muted p-4 rounded-full inline-block mb-4">
          <PhoneIcon className="h-12 w-12 text-primary rotate-90" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          الرجاء تدوير الجهاز
        </h2>
        <p className="text-muted-foreground">
          قم بتدوير جهازك للوضع الأفقي
        </p>
      </div>
    </div>
  );
}