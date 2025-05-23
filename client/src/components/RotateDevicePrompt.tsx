
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { PhoneIcon, RotateCcwIcon, SparklesIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-primary/20 via-background/80 to-primary/20 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-card text-card-foreground rounded-2xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-pink-500 to-orange-500" />
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl" 
            />
            <div className="flex flex-col items-center gap-6 text-center relative">
              <motion.div
                animate={{
                  rotate: [-10, 10, -10],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="bg-primary/10 p-4 rounded-full"
              >
                <PhoneIcon className="h-12 w-12 text-primary rotate-90" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                  تحسين العرض
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <SparklesIcon className="h-5 w-5 text-yellow-500 animate-pulse" />
                  <p className="text-muted-foreground text-lg">
                    يرجى تدوير جهازك للوضع الأفقي لتجربة تعليمية مثالية
                  </p>
                  <SparklesIcon className="h-5 w-5 text-yellow-500 animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground/80 text-center mt-2">
                  تم تصميم المنصة لتوفير أفضل تجربة في الوضع الأفقي
                </p>
              </motion.div>

              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-pink-500 rounded-full blur opacity-50" />
                <RotateCcwIcon className="h-16 w-16 text-primary relative z-10" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
