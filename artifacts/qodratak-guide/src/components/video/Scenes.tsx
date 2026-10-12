import { motion } from 'framer-motion';
import { useEffect, useState, useContext } from 'react';
import { VideoPausedContext } from '@/lib/video';

const B = import.meta.env.BASE_URL;
export const C = { navy: '#0D1B2A', ink: '#171723', coral: '#FF8A70', mint: '#91D7C5', paper: '#F7F4EE' };
const display = "'Tajawal', sans-serif";
const body = "'IBM Plex Sans Arabic', sans-serif";

function useTyped(text: string, startMs: number, perChar = 45) {
  const paused = useContext(VideoPausedContext);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (paused) return;
    let id: number | undefined;
    const t = window.setTimeout(() => {
      id = window.setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), perChar);
    }, n > 0 ? 0 : startMs);
    return () => { window.clearTimeout(t); if (id) window.clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, text, startMs, perChar]);
  return text.slice(0, n);
}

function Typed({ text, start, size, color, weight = 800, font = display }: { text: string; start: number; size: string; color: string; weight?: number; font?: string }) {
  const shown = useTyped(text, start);
  const done = shown.length >= text.length;
  return (
    <div dir="rtl" style={{ fontFamily: font, fontSize: size, fontWeight: weight, color, lineHeight: 1.35, minHeight: `calc(${size} * 1.35)` }}>
      {shown}
      <motion.span
        animate={{ opacity: done ? [1, 0, 1] : 1 }}
        transition={{ duration: 0.9, repeat: Infinity }}
        style={{ display: 'inline-block', width: '0.12em', height: '0.95em', background: C.coral, marginInlineStart: '0.12em', verticalAlign: '-0.12em', opacity: shown.length ? 1 : 0 }}
      />
    </div>
  );
}

function Grain() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{
      background: `radial-gradient(circle at 12% 18%, ${C.mint}22, transparent 34%), radial-gradient(circle at 88% 100%, ${C.coral}26, transparent 40%)`,
    }} />
  );
}

/** Screenshot card: crops dev strip, camera push to focus point. */
function Shot({ src, focus, zoom, delay = 0.8 }: { src: string; focus: [number, number]; zoom: number; delay?: number }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: '1.6vmin', background: '#fff' }}>
      <motion.img
        src={`${B}shots/${src}`}
        className="absolute left-0 w-full"
        style={{ top: '-6.6%', transformOrigin: `${focus[0]}% ${focus[1]}%` }}
        initial={{ scale: 1 }}
        animate={{ scale: zoom }}
        transition={{ delay, duration: 3, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: `${focus[0]}%`, top: `${focus[1] - 6}%`, width: '22vmin', height: '22vmin', marginLeft: '-11vmin', marginTop: '-11vmin', borderRadius: '50%', border: `0.5vmin solid ${C.coral}` }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 1, 1.4], opacity: [0, 0.9, 0] }}
        transition={{ delay: delay + 1.6, duration: 1.4, times: [0, 0.4, 1] }}
      />
    </div>
  );
}

export type Step = { n: string; label: string; line1: string; line2: string; src: string; focus: [number, number]; zoom: number; layout: 'right' | 'left' | 'full' };

const AR = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨'];

export function StepScene({ step, index }: { step: Step; index: number }) {
  const { layout } = step;
  const full = layout === 'full';
  const cardStyle: React.CSSProperties = full
    ? { left: '9%', right: '9%', top: '6%', height: '68%' }
    : layout === 'right'
      ? { right: '5%', top: '12%', width: '58%', aspectRatio: '16/9' }
      : { left: '5%', top: '12%', width: '58%', aspectRatio: '16/9' };
  const textStyle: React.CSSProperties = full
    ? { left: '9%', right: '9%', bottom: '6%' }
    : layout === 'right'
      ? { left: '5%', width: '31%', top: '24%' }
      : { right: '5%', width: '31%', top: '24%' };
  const dir = layout === 'left' ? -1 : 1;

  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ background: C.navy }}
      initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.35 } }}>
      <Grain />
      {/* giant outline numeral as carrier */}
      <motion.div className="absolute select-none" dir="rtl"
        style={{ fontFamily: display, fontWeight: 900, fontSize: '62vmin', lineHeight: 1, color: 'transparent', WebkitTextStroke: `0.25vmin ${C.mint}40`, bottom: '-14vmin', [layout === 'right' ? 'left' : 'right']: '2%' }}
        initial={{ y: '30%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} exit={{ y: '-25%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
        {AR[index]}
      </motion.div>

      <motion.div className="absolute" style={{ ...cardStyle, boxShadow: '0 4vmin 9vmin rgba(0,0,0,.45)', borderRadius: '1.6vmin', perspective: 1200 }}
        initial={{ x: `${dir * 12}%`, rotateY: dir * -14, scale: 0.9, opacity: 0 }}
        animate={{ x: 0, rotateY: 0, scale: 1, opacity: 1 }}
        exit={{ x: `${-dir * 10}%`, scale: 0.92, opacity: 0, transition: { duration: 0.4 } }}
        transition={{ type: 'spring', stiffness: 140, damping: 22, delay: 0.05 }}>
        <Shot src={step.src} focus={step.focus} zoom={step.zoom} />
      </motion.div>

      <motion.div className="absolute" dir="rtl" style={{ ...textStyle, textAlign: 'right' }}
        exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}>
        <motion.div className="flex items-center gap-[1.4vmin]" style={{ justifyContent: 'flex-start' }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }}>
          <span style={{ fontFamily: display, fontWeight: 900, fontSize: '2.6vmin', background: C.coral, color: C.ink, borderRadius: '1vmin', padding: '0.4vmin 1.6vmin' }}>{step.n}</span>
          <span style={{ fontFamily: display, fontWeight: 800, fontSize: '2.6vmin', color: C.mint }}>{step.label}</span>
        </motion.div>
        <div style={{ marginTop: full ? '1vmin' : '2.4vmin' }}>
          <Typed text={step.line1} start={500} size={full ? '6.2vmin' : '6vmin'} color="#fff" weight={900} />
        </div>
        <div style={{ marginTop: '1.2vmin' }}>
          <Typed text={step.line2} start={500 + step.line1.length * 45 + 350} size="3.2vmin" color="#C9D3DC" weight={500} font={body} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function IntroScene() {
  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ background: C.navy }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}>
      <Grain />
      <motion.div className="absolute" style={{ left: '50%', top: '9%', translateX: '-50%' }}
        initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
        <img src={`${B}logo.png`} style={{ width: '17vmin', height: '17vmin', borderRadius: '4vmin', background: C.paper, padding: '1.2vmin' }} />
      </motion.div>
      <div className="absolute w-full flex flex-col items-center" style={{ top: '33%' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          style={{ fontFamily: display, fontWeight: 800, fontSize: '2.4vmin', color: C.mint }}>دليلك السريع للمنصة</motion.div>
        <Typed text="كيف تستخدم قدراتك؟" start={800} size="10vmin" color="#fff" weight={900} />
      </div>
      <motion.div className="absolute" style={{ left: '20%', right: '20%', top: '66%', height: '60%', borderRadius: '1.6vmin', overflow: 'hidden', boxShadow: '0 4vmin 9vmin rgba(0,0,0,.5)' }}
        initial={{ y: '40%', rotateX: 25, opacity: 0 }} animate={{ y: '0%', rotateX: 0, opacity: 1 }}
        exit={{ y: '-60%', scale: 1.5, transition: { duration: 0.5 } }}
        transition={{ delay: 1.6, type: 'spring', stiffness: 90, damping: 18 }}>
        <img src={`${B}shots/landing-signed-out.jpg`} className="w-full" style={{ marginTop: '-6.6%' }} />
      </motion.div>
    </motion.div>
  );
}

export function OutroScene() {
  const tiles = ['student-dashboard.jpg', 'foundation.jpg', 'computerized.jpg', 'quantitative-book.jpg'];
  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ background: C.navy }}>
      {tiles.map((t, i) => (
        <motion.div key={t} className="absolute overflow-hidden"
          style={{ width: '40%', aspectRatio: '16/9', left: i % 2 ? '8%' : '52%', top: i < 2 ? '6%' : '52%', borderRadius: '1.4vmin' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.2], x: ['0%', '0%', '0%', i % 2 ? '60%' : '-60%'], y: ['0%', '0%', '0%', i < 2 ? '60%' : '-60%'] }}
          transition={{ duration: 2, times: [0, 0.25, 0.7, 1], delay: i * 0.12 }}>
          <img src={`${B}shots/${t}`} className="w-full" style={{ marginTop: '-6.6%' }} />
        </motion.div>
      ))}
      <motion.div className="absolute w-full text-center" style={{ top: '42%', fontFamily: display, fontWeight: 900, fontSize: '8vmin', color: '#fff' }}
        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 1.2] }}
        transition={{ delay: 1.2, duration: 1.6, times: [0, 0.2, 0.8, 1] }}>
        خطوة واحدة كل يوم
      </motion.div>
      <motion.div className="absolute rounded-full" style={{ left: '50%', top: '50%', width: '10vmin', height: '10vmin', margin: '-5vmin', background: C.paper }}
        initial={{ scale: 0 }} animate={{ scale: 30 }} transition={{ delay: 2.6, duration: 0.7, ease: [0.7, 0, 0.3, 1] }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center" dir="rtl">
        <motion.img src={`${B}logo.png`} style={{ width: '20vmin' }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 3.1, type: 'spring', stiffness: 240, damping: 15 }} />
        <motion.div style={{ fontFamily: display, fontWeight: 900, fontSize: '12vmin', color: C.coral, lineHeight: 1.1 }}
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 3.35 }}>قدراتك</motion.div>
        <motion.div style={{ fontFamily: display, fontWeight: 800, fontSize: '3.4vmin', color: C.ink, marginTop: '1vmin' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.7 }}>خطتك أوضح لـ القدرات · ابدأ مجانًا ٣ أيام</motion.div>
      </div>
    </motion.div>
  );
}

export const STEPS: Step[] = [
  { n: '١', label: 'لوحتي', line1: 'هنا تبدأ كل يوم', line2: 'مهمتك اليوم تظهر أولًا: اضغط «ابدأ من هنا»', src: 'student-dashboard.jpg', focus: [50, 48], zoom: 1.45, layout: 'right' },
  { n: '٢', label: 'دورتي', line1: 'هنا تحجز موعد اختبارك', line2: 'واختر مسار التحضير المناسب لك', src: 'preparation-course.jpg', focus: [50, 40], zoom: 1.35, layout: 'left' },
  { n: '٣', label: 'مهام اليوم', line1: 'هنا مهامك اليومية', line2: 'ابدأ بقياس البداية لتُبنى خطتك', src: 'today.jpg', focus: [45, 45], zoom: 1.3, layout: 'full' },
  { n: '٤', label: 'التأسيس', line1: 'هنا تتعلّم من الأساس', line2: 'اختر الكمي أو اللفظي وابدأ', src: 'foundation.jpg', focus: [55, 60], zoom: 1.5, layout: 'right' },
  { n: '٥', label: 'كتاب التأسيس', line1: 'هنا تقرأ الشرح خطوة بخطوة', line2: 'من الأساس إلى الإتقان في 50 موضوعًا', src: 'quantitative-book.jpg', focus: [55, 50], zoom: 1.3, layout: 'full' },
  { n: '٦', label: 'المحوسب', line1: 'هنا تتدرّب كأنه الاختبار', line2: 'بنوك أسئلة ودروس منشورة لكل قسم', src: 'computerized.jpg', focus: [60, 62], zoom: 1.45, layout: 'left' },
  { n: '٧', label: 'نتائجي', line1: 'هنا تراجع نتائجك', line2: 'تظهر تقاريرك بعد كل اختبار تُكمله', src: 'results.jpg', focus: [48, 58], zoom: 1.5, layout: 'right' },
  { n: '٨', label: 'حسابي', line1: 'هنا تدير حسابك', line2: 'بياناتك واشتراكك في مكان واحد', src: 'account.jpg', focus: [45, 40], zoom: 1.3, layout: 'full' },
];
