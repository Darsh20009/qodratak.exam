import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useContext } from 'react';
import { VideoPausedContext } from '@/lib/video';
import { Greeting } from './viewer';

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

export function Grain() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{
      background: `radial-gradient(circle at 12% 18%, ${C.mint}22, transparent 34%), radial-gradient(circle at 88% 100%, ${C.coral}26, transparent 40%)`,
    }} />
  );
}

export type Callout = { x: number; y: number; text: string; at: number; side?: 'l' | 'r' };

/** Image layer inside the persistent browser frame: camera push + timed callouts. */
function ShotLayer({ step }: { step: Step }) {
  const { src, focus, zoom, crop = false, callouts = [] } = step;
  const delay = 0.9;
  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ background: C.paper }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5, delay: 0.25 } }}
      transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}>
      <motion.div className="absolute left-0 w-full" style={{ top: crop ? '-6.6%' : 0, transformOrigin: `${focus[0]}% ${focus[1]}%` }}
        initial={{ scale: 1.04 }} animate={{ scale: zoom }} transition={{ delay: 0.15, duration: delay + 2.6, ease: [0.45, 0, 0.25, 1] }}>
        <img src={`${B}shots/${src}`} className="block w-full" />
        {callouts.map((c, i) => (
          <div key={i} className="absolute" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
            <motion.div style={{ position: 'absolute', width: '2.4vmin', height: '2.4vmin', margin: '-1.2vmin', borderRadius: '50%', border: `0.45vmin solid ${C.coral}`, background: `${C.coral}33` }}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.3, 1], opacity: 1 }} transition={{ delay: c.at, duration: 0.45 }} />
            <motion.div dir="rtl" style={{ position: 'absolute', top: '-1.9vmin', [c.side === 'l' ? 'right' : 'left']: '2vmin', whiteSpace: 'nowrap', background: C.navy, color: '#fff', fontFamily: display, fontWeight: 800, fontSize: '1.9vmin', padding: '0.7vmin 1.4vmin', borderRadius: '0.9vmin', boxShadow: '0 1vmin 3vmin rgba(13,27,42,.35)', borderInlineStart: `0.5vmin solid ${C.coral}` }}
              initial={{ opacity: 0, x: c.side === 'l' ? 12 : -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: c.at + 0.15, duration: 0.4 }}>
              {c.text}
            </motion.div>
          </div>
        ))}
      </motion.div>
      {!callouts.length && (
        <motion.div className="absolute pointer-events-none"
          style={{ left: `${focus[0]}%`, top: `${focus[1] - (crop ? 6 : 0)}%`, width: '18vmin', height: '18vmin', marginLeft: '-9vmin', marginTop: '-9vmin', borderRadius: '50%', border: `0.45vmin solid ${C.coral}` }}
          initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: [0.3, 1, 1.4], opacity: [0, 0.9, 0] }}
          transition={{ delay: delay + 1.5, duration: 1.4, times: [0, 0.4, 1] }} />
      )}
    </motion.div>
  );
}

/** Frame poses: one fixed-size 16:9 window (58% of canvas) placed by transform only. */
const FW = 58;
type Pose = { left: number; top: number; scale: number; opacity: number };
function poseFor(index: number): Pose {
  if (index < 0) return { left: 20, top: 66, scale: 60 / FW, opacity: 1 };
  if (index >= STEPS.length) return { left: 21, top: 21, scale: 1, opacity: 0 };
  const l = STEPS[index].layout;
  if (l === 'full') return { left: 21, top: 4, scale: 1, opacity: 1 };
  if (l === 'right') return { left: 37, top: 12, scale: 1, opacity: 1 };
  return { left: 5, top: 12, scale: 1, opacity: 1 };
}
const LANDING: Step = { n: '', label: '', line1: '', line2: '', src: 'landing-signed-out.jpg', crop: true, url: '/', focus: [50, 30], zoom: 1.04, layout: 'full' };

/** Persistent browser window: never unmounts between pages, glides between poses while screens cross-dissolve inside. */
export function BrowserStage({ index }: { index: number }) {
  const p = poseFor(index);
  const step = index < 0 ? LANDING : STEPS[Math.min(index, STEPS.length - 1)];
  const intro = index < 0;
  const outro = index >= STEPS.length;
  return (
    <motion.div className="absolute" style={{ left: 0, top: 0, width: `${FW}%`, aspectRatio: '16/9', transformOrigin: '0 0', zIndex: 1 }}
      initial={{ x: `${(20 / FW) * 100}%`, y: `${(110 / FW) * 100}%`, scale: 60 / FW, opacity: 0 }}
      animate={{ x: `${(p.left / FW) * 100}%`, y: `${(p.top / FW) * 100}%`, scale: p.scale, opacity: p.opacity }}
      transition={intro ? { delay: 1.5, duration: 1.1, ease: [0.22, 1, 0.36, 1] }
        : outro ? { duration: 0.7, ease: [0.65, 0, 0.35, 1], opacity: { duration: 0.45, delay: 0.25 } }
        : { duration: 0.95, ease: [0.65, 0, 0.35, 1] }}>
      <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ borderRadius: '1.4vmin', background: '#E9E4DA', boxShadow: '0 4vmin 9vmin rgba(0,0,0,.45)' }}>
        <div className="flex items-center shrink-0" dir="ltr" style={{ height: '3.6vmin', padding: '0 1.4vmin', gap: '0.8vmin', background: '#E9E4DA' }}>
          {['#FF8A70', '#F2C96B', '#91D7C5'].map((c) => <span key={c} style={{ width: '1.1vmin', height: '1.1vmin', borderRadius: '50%', background: c }} />)}
          <div className="relative" style={{ flex: 1, margin: '0 6vmin', height: '2.2vmin', borderRadius: '1.1vmin', background: C.paper, overflow: 'hidden' }}>
            <AnimatePresence initial={false}>
              <motion.div key={step.url + index} className="absolute inset-0 flex items-center justify-center"
                style={{ fontFamily: body, fontSize: '1.3vmin', color: '#6B6F76' }}
                initial={{ opacity: 0, y: '60%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '-60%' }} transition={{ duration: 0.35 }}>
                qodratak.sa{step.url}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden" style={{ background: C.paper }}>
          <AnimatePresence initial={false}>
            <ShotLayer key={index} step={step} />
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export type Step = { n: string; label: string; line1: string; line2: string; src: string; focus: [number, number]; zoom: number; layout: 'right' | 'left' | 'full'; url: string; crop?: boolean; callouts?: Callout[]; chapter?: string };

const AR = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠', '١١', '١٢', '١٣', '١٤'];

export function StepScene({ step, index }: { step: Step; index: number }) {
  const { layout } = step;
  const full = layout === 'full';
  const textStyle: React.CSSProperties = full
    ? { left: '12%', right: '12%', bottom: '4.5%' }
    : layout === 'right'
      ? { left: '5%', width: '31%', top: '24%' }
      : { right: '5%', width: '31%', top: '24%' };

  return (
    <motion.div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* giant outline numeral as carrier */}
      <motion.div className="absolute select-none" dir="rtl"
        style={{ fontFamily: display, fontWeight: 900, fontSize: '38vmin', lineHeight: 1, color: 'transparent', WebkitTextStroke: `0.22vmin ${C.mint}38`, bottom: '-8vmin', [layout === 'right' ? 'left' : 'right']: '2%' }}
        initial={{ y: '18%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} exit={{ y: '-12%', opacity: 0, transition: { duration: 0.45 } }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
        {AR[index]}
      </motion.div>

      <motion.div className="absolute" dir="rtl" style={{ ...textStyle, textAlign: 'right' }}
        exit={{ opacity: 0, y: -14, transition: { duration: 0.4 } }}>
        <motion.div className="flex items-center gap-[1.4vmin]" style={{ justifyContent: 'flex-start' }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.45 }}>
          <span style={{ fontFamily: display, fontWeight: 900, fontSize: '2.2vmin', background: C.coral, color: C.ink, borderRadius: '0.8vmin', padding: '0.3vmin 1.3vmin' }}>{step.n}</span>
          {step.chapter && <span style={{ fontFamily: body, fontWeight: 600, fontSize: '1.9vmin', color: '#8FA1B3' }}>{step.chapter}</span>}
          <span style={{ fontFamily: display, fontWeight: 800, fontSize: '2.2vmin', color: C.mint }}>{step.label}</span>
        </motion.div>
        <div style={{ marginTop: full ? '1vmin' : '2.4vmin' }}>
          <Typed text={step.line1} start={500} size={full ? '5.4vmin' : '5.8vmin'} color="#fff" weight={900} />
        </div>
        <div style={{ marginTop: '1.2vmin' }}>
          <Typed text={step.line2} start={500 + step.line1.length * 45 + 350} size={full ? '2.8vmin' : '3.1vmin'} color="#C9D3DC" weight={500} font={body} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function IntroScene() {
  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ zIndex: 2 }}
      exit={{ opacity: 0, y: '-4%', transition: { duration: 0.5 } }}>
      <motion.div className="absolute" style={{ left: '50%', top: '9%', translateX: '-50%' }}
        initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
        <img src={`${B}qodratak-icon-light.png`} style={{ width: '11vmin', height: '11vmin', borderRadius: '2.8vmin', background: C.paper, padding: '0.9vmin', objectFit: 'contain' }} />
      </motion.div>
      <div className="absolute w-full flex flex-col items-center" style={{ top: '25%' }}>
        <Greeting size="9vmin" />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          style={{ fontFamily: display, fontWeight: 800, fontSize: '3.4vmin', color: C.mint }}>دليلك الكامل للمنصة</motion.div>
        <Typed text="كيف تستخدم قدراتك؟" start={800} size="10vmin" color="#fff" weight={900} />
      </div>
    </motion.div>
  );
}

export function OutroScene() {
  const tiles = ['student-dashboard.jpg', 'n-exam-answer.jpg', 'computerized.jpg', 'quantitative-book.jpg'];
  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ zIndex: 2 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}>
      {tiles.map((t, i) => (
        <motion.div key={t} className="absolute overflow-hidden"
          style={{ width: '40%', aspectRatio: '16/9', left: i % 2 ? '8%' : '52%', top: i < 2 ? '6%' : '52%', borderRadius: '1.4vmin' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.2], x: ['0%', '0%', '0%', i % 2 ? '60%' : '-60%'], y: ['0%', '0%', '0%', i < 2 ? '60%' : '-60%'] }}
          transition={{ duration: 2, times: [0, 0.25, 0.7, 1], delay: i * 0.12 }}>
          <img src={`${B}shots/${t}`} className="w-full" style={{ marginTop: t.startsWith('n-') ? 0 : '-6.6%' }} />
        </motion.div>
      ))}
      <motion.div className="absolute w-full text-center" style={{ top: '42%', fontFamily: display, fontWeight: 900, fontSize: '8vmin', color: '#fff' }}
        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 1.2] }}
        transition={{ delay: 1.2, duration: 1.6, times: [0, 0.2, 0.8, 1] }}>
        خطوة واحدة كل يوم
      </motion.div>
      <motion.div className="absolute rounded-full" style={{ left: '50%', top: '50%', width: '10vmin', height: '10vmin', margin: '-5vmin', background: C.paper }}
        initial={{ scale: 0 }} animate={{ scale: 30 }} transition={{ delay: 2.1, duration: 0.75, ease: [0.7, 0, 0.3, 1] }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center" dir="rtl">
        <motion.img src={`${B}qodratak-logo-transparent.png`} style={{ width: '46vmin' }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 2.45, type: 'spring', stiffness: 240, damping: 15 }} />
        <motion.div style={{ fontFamily: display, fontWeight: 800, fontSize: '3.4vmin', color: C.ink, marginTop: '1vmin' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.15 }}>دليلك داخل المنصة · ابدأ تجربتك المجانية ٣ أيام</motion.div>
      </div>
    </motion.div>
  );
}

const CH = { learn: 'التعلّم', train: 'التدريب والاختبارات', follow: 'المتابعة' };
export const STEPS: Step[] = [
  { n: '١', chapter: CH.learn, label: 'لوحتي', line1: 'هنا تبدأ كل يوم', line2: 'مهمتك اليوم تظهر أولًا: اضغط «ابدأ من هنا»', src: 'student-dashboard.jpg', crop: true, url: '/', focus: [50, 48], zoom: 1.4, layout: 'right' },
  { n: '٢', chapter: CH.learn, label: 'دورتي', line1: 'هنا تحجز موعد اختبارك', line2: 'واختر مسار التحضير المناسب لك', src: 'preparation-course.jpg', crop: true, url: '/preparation-course', focus: [50, 40], zoom: 1.3, layout: 'left' },
  { n: '٣', chapter: CH.learn, label: 'مهام اليوم', line1: 'هنا مهامك اليومية', line2: 'ابدأ بقياس البداية لتُبنى خطتك', src: 'today.jpg', crop: true, url: '/learning/today', focus: [45, 45], zoom: 1.25, layout: 'full' },
  { n: '٤', chapter: CH.learn, label: 'التأسيس', line1: 'هنا تتعلّم من الأساس', line2: 'اختر الكمي أو اللفظي وابدأ', src: 'foundation.jpg', crop: true, url: '/foundation', focus: [55, 60], zoom: 1.4, layout: 'right' },
  { n: '٥', chapter: CH.learn, label: 'كتاب التأسيس', line1: 'هنا تقرأ الشرح خطوة بخطوة', line2: 'كتاب الكمي من الأساس إلى الإتقان', src: 'n-book.jpg', url: '/student/foundation-book/quantitative', focus: [55, 30], zoom: 1.25, layout: 'left' },
  { n: '٦', chapter: CH.train, label: 'المحوسب', line1: 'هنا تتدرّب على المحوسب', line2: 'بنوك أسئلة ودروس منشورة للكمي واللفظي', src: 'computerized.jpg', crop: true, url: '/computerized', focus: [60, 62], zoom: 1.4, layout: 'full' },
  { n: '٧', chapter: CH.train, label: 'الاختبارات المحاكية', line1: 'اختر اختبارك', line2: 'لفظي ٦٥ سؤالًا، كمي ٥٥، أو شامل ١٢٠', src: 'n-mock.jpg', url: '/mock-exams', focus: [62, 40], zoom: 1.15, layout: 'right',
    callouts: [{ x: 84, y: 66, text: 'لفظي · ٦٥ دقيقة', at: 1.6, side: 'l' }, { x: 66, y: 66, text: 'كمي · ٥٥ دقيقة', at: 2.3, side: 'l' }, { x: 74, y: 30, text: 'شامل · ١٢٠ سؤالًا', at: 3.0, side: 'l' }] },
  { n: '٨', chapter: CH.train, label: 'قبل البدء', line1: 'اقرأ التعليمات واختر الوضع', line2: 'محاكاة بمراقبة، أو تدريب بدون مراقبة', src: 'n-exam-instr.jpg', url: '/qiyas-exam', focus: [55, 62], zoom: 1.25, layout: 'left',
    callouts: [{ x: 66, y: 60, text: 'وضع المحاكاة', at: 1.6, side: 'l' }, { x: 42, y: 60, text: 'وضع التدريب', at: 2.3, side: 'l' }, { x: 55, y: 79, text: 'أوافق وابدأ', at: 3.0, side: 'l' }] },
  { n: '٩', chapter: CH.train, label: 'داخل الاختبار', line1: 'هكذا يبدو الاختبار من الداخل', line2: 'سؤال واحد في كل شاشة، والمؤقت أمامك', src: 'n-exam-answer.jpg', url: '/qiyas-exam', focus: [40, 35], zoom: 1.08, layout: 'full',
    callouts: [{ x: 7, y: 5, text: 'وقت القسم المتبقي', at: 1.4 }, { x: 58, y: 33, text: 'اختر إجابتك', at: 2.1, side: 'l' }, { x: 9, y: 40, text: 'خريطة الأسئلة', at: 2.8 }, { x: 24, y: 94, text: 'ميّز السؤال لتعود إليه', at: 3.5 }] },
  { n: '١٠', chapter: CH.train, label: 'أسئلة القطعة', line1: 'النص بجانب السؤال', line2: 'اقرأ القطعة ثم «حفظ والتالي»', src: 'n-exam-q2.jpg', url: '/qiyas-exam', focus: [55, 45], zoom: 1.2, layout: 'right',
    callouts: [{ x: 60, y: 22, text: 'نص القطعة', at: 1.6, side: 'l' }, { x: 46, y: 94, text: 'حفظ والتالي', at: 2.4, side: 'l' }] },
  { n: '١١', chapter: CH.train, label: 'اختبار مخصص', line1: 'اصنع اختبارك بنفسك', line2: 'حدّد عدد أسئلة اللفظي والكمي والوقت', src: 'n-custom.jpg', url: '/custom-exam', focus: [50, 35], zoom: 1.3, layout: 'left' },
  { n: '١٢', chapter: CH.follow, label: 'نتائجي', line1: 'هنا تراجع نتائجك', line2: 'نتائج تدريبية داخل المنصة، وليست درجة قياس الرسمية', src: 'results.jpg', crop: true, url: '/records', focus: [48, 58], zoom: 1.4, layout: 'right' },
  { n: '١٣', chapter: CH.follow, label: 'حسابي', line1: 'هنا تدير حسابك', line2: 'بياناتك واشتراكك في مكان واحد', src: 'account.jpg', crop: true, url: '/account', focus: [45, 40], zoom: 1.25, layout: 'full' },
  { n: '١٤', chapter: CH.follow, label: 'الدعم', line1: 'عندك سؤال؟', line2: 'الأسئلة الشائعة والدعم في صفحة واحدة', src: 'n-support.jpg', url: '/support', focus: [50, 40], zoom: 1.25, layout: 'left' },
];
