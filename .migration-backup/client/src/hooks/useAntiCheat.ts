import { useEffect, useRef, useState, useCallback } from 'react';

interface AntiCheatOptions {
  onViolation?: (type: string, count: number) => void;
  maxViolations?: number;
  onMaxViolations?: () => void;
  enabled?: boolean;
}

interface AntiCheatState {
  violations: number;
  lastViolationType: string | null;
  isWarningVisible: boolean;
  dismissWarning: () => void;
}

export function useAntiCheat(options: AntiCheatOptions = {}): AntiCheatState {
  const { onViolation, maxViolations = 3, onMaxViolations, enabled = true } = options;
  const [violations, setViolations] = useState(0);
  const [lastViolationType, setLastViolationType] = useState<string | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const violationCount = useRef(0);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // على الجوال: لا تُطبَّق قواعد مراقبة التبديل والتمويه — تُطلَق كثيراً بسبب الإشعارات والتبديل الطبيعي
  const isMobileDevice = typeof window !== 'undefined' &&
    (window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);

  const recordViolation = useCallback((type: string) => {
    if (!enabled) return;

    violationCount.current += 1;
    const count = violationCount.current;

    setViolations(count);
    setLastViolationType(type);
    setIsWarningVisible(true);

    if (warningTimer.current) clearTimeout(warningTimer.current);
    warningTimer.current = setTimeout(() => setIsWarningVisible(false), 5000);

    onViolation?.(type, count);

    if (count >= maxViolations) {
      onMaxViolations?.();
    }
  }, [enabled, maxViolations, onViolation, onMaxViolations]);

  useEffect(() => {
    if (!enabled) return;

    // Tab/window visibility change (tab switching) — معطّل على الجوال
    const handleVisibilityChange = () => {
      if (document.hidden && !isMobileDevice) {
        recordViolation('tab_switch');
      }
    };

    // Window blur (switching to another app) — معطّل على الجوال
    const handleWindowBlur = () => {
      if (!isMobileDevice) {
        recordViolation('window_blur');
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation('right_click');
    };

    // Prevent keyboard shortcuts (F12, Ctrl+C, Ctrl+V, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent developer tools
      if (e.key === 'F12') {
        e.preventDefault();
        recordViolation('devtools');
        return;
      }

      // Prevent Ctrl+Shift+I (Chrome devtools), Ctrl+U (view source)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        recordViolation('devtools');
        return;
      }
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return;
      }

      // Prevent Ctrl+C (copy) and Ctrl+A (select all)
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        recordViolation('copy_attempt');
        return;
      }

      // Prevent print screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        recordViolation('screenshot');
        return;
      }
    };

    // Prevent text selection via drag
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      // Allow selection in input fields and textareas
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };
  }, [enabled, recordViolation]);

  const dismissWarning = useCallback(() => {
    setIsWarningVisible(false);
    if (warningTimer.current) clearTimeout(warningTimer.current);
  }, []);

  return { violations, lastViolationType, isWarningVisible, dismissWarning };
}
