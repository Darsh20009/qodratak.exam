import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';

/** Strips control/bidi-override chars, collapses whitespace, caps at 32 code points. Rendered only as React text. */
export function cleanName(v: unknown): string {
  if (typeof v !== 'string') return '';
  const s = v.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u2069\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  return Array.from(s).slice(0, 32).join('').trim();
}

const ViewerContext = createContext('');
export const useViewerName = () => useContext(ViewerContext);

/** Parent → iframe: {type:'qodratak.guide.viewer', displayName}. Same-origin parent only; nothing persisted or fetched. */
export function ViewerProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('');
  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) return;
    const origin = window.location.origin;
    const onMsg = (e: MessageEvent) => {
      if (e.source !== window.parent || e.origin !== origin) return;
      const d = e.data as { type?: unknown; displayName?: unknown } | null;
      if (!d || typeof d !== 'object' || d.type !== 'qodratak.guide.viewer') return;
      setName(cleanName(d.displayName));
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: 'qodratak.guide.ready' }, origin);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  return <ViewerContext.Provider value={name}>{children}</ViewerContext.Provider>;
}

export function Greeting({ size = '9vmin', color = '#FF8A70' }: { size?: string; color?: string }) {
  const name = useViewerName();
  return (
    <motion.div dir="rtl" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.2 }}
      style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 900, fontSize: size, color, lineHeight: 1.2, maxWidth: '86vw', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {name ? `هلا، ${name}` : 'هلا'}
    </motion.div>
  );
}
