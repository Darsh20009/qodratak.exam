/// <reference lib="dom" />
import { useEffect, useRef, useState as useStateSafe, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoCanvas, useVideoPlayer, VideoPausedContext } from '@/lib/video';
import { C } from './Scenes';

function Grain() {
  return <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 12% 18%, ${C.mint}22, transparent 34%), radial-gradient(circle at 88% 100%, ${C.coral}26, transparent 40%)` }} />;
}

const B = import.meta.env.BASE_URL;
const display = "'Tajawal', sans-serif";
const body = "'IBM Plex Sans Arabic', sans-serif";
const EASE = [0.65, 0, 0.35, 1] as const;

/** Original public marketing film, restored from the parent of 46e97e5. */
export const MARKETING_DURATIONS = {
  m_hook: 4500,
  m_gather: 4000,
  m_foundation: 4000,
  m_computerized: 4500,
  m_exam: 6500,
  m_results: 4000,
  m_plans: 3500,
  m_outro: 5000,
};
const START_SEC: Record<string, number> = (() => {
  const o: Record<string, number> = {}; let c = 0;
  for (const [k, ms] of Object.entries(MARKETING_DURATIONS)) { o[k] = c / 1000; c += ms; }
  return o;
})();

/* ---------- persistent browser window (stays mounted, glides between poses) ---------- */
type Shot = { src: string; url: string; crop?: boolean; focus: [number, number]; zoom: number; pins?: { x: number; y: number; text: string; at: number }[] };
type Pose = { left: number; top: number; w: number; rot: number; opacity: number };
const STAGE: Record<string, { pose: Pose; shots: Shot[] }> = {
  m_hook: { pose: { left: 50, top: 110, w: 40, rot: 6, opacity: 0 }, shots: [{ src: 'landing-signed-out.jpg', crop: true, url: '/', focus: [50, 30], zoom: 1 }] },
  m_gather: { pose: { left: 50, top: 108, w: 40, rot: 4, opacity: 0 }, shots: [{ src: 'landing-signed-out.jpg', crop: true, url: '/', focus: [50, 30], zoom: 1 }] },
  m_foundation: { pose: { left: 3, top: 20, w: 54, rot: 0, opacity: 1 }, shots: [
    { src: 'foundation.jpg', crop: true, url: '/foundation', focus: [55, 55], zoom: 1.25 },
    { src: 'n-book.jpg', url: '/student/foundation-book/quantitative', focus: [55, 30], zoom: 1.2 }] },
  m_computerized: { pose: { left: 43, top: 20, w: 54, rot: 0, opacity: 1 }, shots: [
    { src: 'computerized.jpg', crop: true, url: '/computerized', focus: [60, 60], zoom: 1.3 },
    { src: 'n-mock.jpg', url: '/mock-exams', focus: [62, 45], zoom: 1.12, pins: [{ x: 84, y: 66, text: 'لفظي', at: 0.5 }, { x: 66, y: 66, text: 'كمي', at: 0.9 }] }] },
  m_exam: { pose: { left: 15, top: 3, w: 70, rot: 0, opacity: 1 }, shots: [
    { src: 'n-exam-instr.jpg', url: '/qiyas-exam', focus: [55, 62], zoom: 1.15, pins: [{ x: 66, y: 60, text: 'وضع المحاكاة', at: 0.5 }] },
    { src: 'n-exam-answer.jpg', url: '/qiyas-exam', focus: [40, 30], zoom: 1.06, pins: [{ x: 7, y: 5, text: 'المؤقت', at: 0.4 }, { x: 58, y: 33, text: 'سؤال بكل شاشة', at: 0.9 }, { x: 9, y: 44, text: 'خريطة الأسئلة', at: 1.4 }] },
    { src: 'n-exam-q2.jpg', url: '/qiyas-exam', focus: [60, 35], zoom: 1.15, pins: [{ x: 60, y: 22, text: 'القطعة والسؤال', at: 0.4 }] }] },
  m_results: { pose: { left: 3, top: 20, w: 54, rot: 0, opacity: 1 }, shots: [
    { src: 'results.jpg', crop: true, url: '/records', focus: [48, 55], zoom: 1.3 },
    { src: 'n-records.jpg', url: '/records', focus: [50, 40], zoom: 1.15 }] },
  m_plans: { pose: { left: 43, top: 20, w: 54, rot: 0, opacity: 1 }, shots: [
    { src: 'student-dashboard.jpg', crop: true, url: '/', focus: [50, 45], zoom: 1.3 },
    { src: 'today.jpg', crop: true, url: '/learning/today', focus: [45, 45], zoom: 1.2 }] },
  m_outro: { pose: { left: 30, top: 40, w: 40, rot: 0, opacity: 0 }, shots: [{ src: 'student-dashboard.jpg', crop: true, url: '/', focus: [50, 45], zoom: 1 }] },
};

function ShotPlane({ shot, hold }: { shot: Shot; hold: number }) {
  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ background: C.paper }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.2 } }} transition={{ duration: 0.45 }}>
      {/* crop:true removes the dev-preview strip baked into old captures; the image is shifted, never stretched */}
      <motion.div className="absolute left-0 w-full" style={{ top: shot.crop ? '-6.6%' : 0, transformOrigin: `${shot.focus[0]}% ${shot.focus[1]}%` }}
        initial={{ scale: 1.02 }} animate={{ scale: shot.zoom }} transition={{ duration: hold, ease: [0.45, 0, 0.25, 1] }}>
        <img src={`${B}shots/${shot.src}`} className="block w-full" />
        {shot.pins?.map((p, i) => (
          <div key={i} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <motion.div style={{ position: 'absolute', width: '3.6vmin', height: '3.6vmin', margin: '-1.8vmin', borderRadius: '50%', border: `0.45vmin solid ${C.coral}`, background: `${C.coral}33` }}
              initial={{ scale: 0 }} animate={{ scale: [0, 1.35, 1] }} transition={{ delay: p.at, duration: 0.4 }} />
            <motion.div dir="rtl" style={{ position: 'absolute', top: '-3.4vmin', [p.x < 30 ? 'left' : 'right']: '2.6vmin', whiteSpace: 'nowrap', background: C.navy, color: '#fff', fontFamily: display, fontWeight: 800, fontSize: '4.2vmin', padding: '0.8vmin 2vmin', borderRadius: '1.2vmin', borderInlineStart: `0.5vmin solid ${C.coral}` }}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: p.at + 0.12, duration: 0.35 }}>{p.text}</motion.div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function useSubIndex(count: number, totalMs: number, paused: boolean) {
  const [i, setI] = useStateSafe(0);
  useEffect(() => {
    if (paused || count < 2 || i >= count - 1) return;
    const t = window.setTimeout(() => setI((v) => v + 1), totalMs / count);
    return () => window.clearTimeout(t);
  }, [i, count, totalMs, paused, setI]);
  return i;
}

function MarketingStage({ sceneKey, mountKey }: { sceneKey: string; mountKey: string }) {
  const paused = useContext(VideoPausedContext);
  const st = STAGE[sceneKey] ?? STAGE.m_hook;
  const dur = MARKETING_DURATIONS[sceneKey as keyof typeof MARKETING_DURATIONS] ?? 4000;
  const sub = useSubIndex(st.shots.length, dur, paused);
  const shot = st.shots[Math.min(sub, st.shots.length - 1)];
  const p = st.pose;
  const W = 74; // fixed element width; size via scale only
  return (
    <motion.div className="absolute" style={{ left: 0, top: 0, width: `${W}%`, aspectRatio: '16/9', transformOrigin: '0 0', zIndex: 1 }}
      initial={false}
      animate={{ x: `${(p.left / W) * 100}%`, y: `${(p.top / W) * 100 * (16 / 9) * (9 / 16)}%`, scale: p.w / W, rotate: p.rot, opacity: p.opacity }}
      transition={{ duration: 0.9, ease: EASE }}>
      <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ borderRadius: '1.2vmin', background: '#E9E4DA', boxShadow: '0 4vmin 9vmin rgba(0,0,0,.45)' }}>
        <div className="flex items-center shrink-0" dir="ltr" style={{ height: '5.4vmin', padding: '0 1.6vmin', gap: '1vmin' }}>
          {['#FF8A70', '#F2C96B', '#91D7C5'].map((c) => <span key={c} style={{ width: '1.1vmin', height: '1.1vmin', borderRadius: '50%', background: c }} />)}
          <div className="relative" style={{ flex: 1, margin: '0 6vmin', height: '4vmin', borderRadius: '2vmin', background: C.paper, overflow: 'hidden' }}>
            <AnimatePresence initial={false}>
              <motion.div key={shot.url + mountKey + sub} className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: body, fontSize: '3.2vmin', fontWeight: 700, color: '#2E343B' }}
                initial={{ opacity: 0, y: '60%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '-60%' }} transition={{ duration: 0.3 }}>
                qodratak.sa{shot.url}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence initial={false}>
            <ShotPlane key={mountKey + sub} shot={shot} hold={dur / 1000 / st.shots.length + 0.6} />
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- scene copy layers ---------- */
function Copy({ side, eyebrow, title, line, accent }: { side: 'l' | 'r'; eyebrow: string; title: string; line: string; accent?: string }) {
  return (
    <motion.div className="absolute" dir="rtl" style={{ [side === 'r' ? 'right' : 'left']: '5%', width: '36%', top: '15%', textAlign: 'right', zIndex: 2 }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.35 } }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ fontFamily: display, fontWeight: 800, fontSize: '4.2vmin', color: C.mint }}>{eyebrow}</motion.div>
      <div style={{ overflow: 'hidden', marginTop: '1.4vmin', paddingBottom: '0.6vmin' }}>
        <motion.div initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ fontFamily: display, fontWeight: 900, fontSize: '10vmin', lineHeight: 1.15, color: '#fff' }}>{title}</motion.div>
      </div>
      {accent && (
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.85, duration: 0.5 }}
          style={{ transformOrigin: 'right', display: 'inline-block', marginTop: '1vmin', background: C.coral, color: C.ink, fontFamily: display, fontWeight: 900, fontSize: '4.6vmin', padding: '0.4vmin 1.8vmin', borderRadius: '0.8vmin' }}>{accent}</motion.div>
      )}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.5 }}
        style={{ fontFamily: body, fontSize: '5vmin', fontWeight: 600, lineHeight: 1.4, color: '#C9D3DC', marginTop: '2vmin' }}>{line}</motion.div>
    </motion.div>
  );
}

const SCATTER = [
  { t: 'ملف PDF من قروب', x: 14, y: 22, r: -9 }, { t: 'قناة تيليجرام', x: 70, y: 16, r: 7 }, { t: 'بنك أسئلة قديم', x: 8, y: 62, r: 5 },
  { t: 'مقطع يوتيوب', x: 74, y: 70, r: -6 }, { t: 'تجميعات متفرقة', x: 40, y: 80, r: 3 }, { t: 'جدول ما اكتمل', x: 44, y: 9, r: -4 },
  { t: 'موقع ثالث', x: 84, y: 44, r: 10 }, { t: 'ملاحظات بالجوال', x: 2, y: 40, r: -12 },
];

function HookScene() {
  return (
    <motion.div className="absolute inset-0" style={{ zIndex: 2 }} exit={{ opacity: 1, transition: { duration: 0.5 } }}>
      {SCATTER.map((s, i) => (
        <motion.div key={s.t} className="absolute" dir="rtl"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontFamily: body, fontWeight: 600, fontSize: '4vmin', color: C.ink, background: i % 3 === 0 ? C.coral : i % 3 === 1 ? C.paper : C.mint, padding: '1vmin 2vmin', borderRadius: '1vmin', boxShadow: '0 1.5vmin 3vmin rgba(0,0,0,.35)', whiteSpace: 'nowrap' }}
          initial={{ scale: 0, rotate: s.r * 3 }} animate={{ scale: 1, rotate: [s.r, -s.r, s.r], x: [0, 14, -10, 0], y: [0, -10, 8, 0] }}
          transition={{ scale: { type: 'spring', stiffness: 300, damping: 15, delay: 1.4 + i * 0.22 }, rotate: { duration: 3, repeat: Infinity }, x: { duration: 4, repeat: Infinity }, y: { duration: 3.4, repeat: Infinity } }}
          exit={{ left: '46%', top: '46%', scale: 0.2, opacity: 0, rotate: 0, transition: { duration: 0.55, ease: [0.7, 0, 0.84, 0], delay: i * 0.03 } }}>
          {s.t}
        </motion.div>
      ))}
      <motion.div className="absolute inset-0 flex items-center justify-center" dir="rtl"
        initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1.04, 1.5], y: ['0%', '0%', '0%', '-30%'] }}
        transition={{ duration: 1.5, times: [0, 0.2, 0.75, 1], ease: 'easeOut' }}
        style={{ fontFamily: display, fontWeight: 900, fontSize: '22vmin', color: C.coral }}>سلام!</motion.div>
      <div className="absolute inset-0 flex flex-col items-center justify-center" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 1.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.35, duration: 0.45 }}
          style={{ fontFamily: display, fontWeight: 900, fontSize: '14vmin', color: '#fff', textShadow: '0 1vmin 4vmin rgba(0,0,0,.5)' }}>ليه دايمًا مشتّت؟</motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 }}
          style={{ fontFamily: body, fontWeight: 500, fontSize: '5.4vmin', color: '#E3E9EE', marginTop: '1vmin', background: 'rgba(13,27,42,.7)', padding: '0.4vmin 2vmin', borderRadius: '1vmin' }}>مصدر هنا وملف هناك… ووقتك يضيع</motion.div>
      </div>
    </motion.div>
  );
}

function GatherScene() {
  return (
    <motion.div className="absolute inset-0 flex flex-col items-center justify-center" dir="rtl" style={{ zIndex: 2 }}
      exit={{ opacity: 0, scale: 1.08, transition: { duration: 0.45 } }}>
      <motion.div className="absolute rounded-full" style={{ width: '60vmin', height: '60vmin', border: `0.3vmin solid ${C.mint}55` }}
        initial={{ scale: 0.2, opacity: 1 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 1.4, ease: 'easeOut' }} />
      <motion.img src={`${B}qodratak-icon-light.png`} style={{ width: '16vmin', height: '16vmin', borderRadius: '3.6vmin', background: C.paper, padding: '1.2vmin' }}
        initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 14, delay: 0.1 }} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
        style={{ fontFamily: display, fontWeight: 900, fontSize: '10vmin', color: '#fff', marginTop: '3vmin', textAlign: 'center', lineHeight: 1.2 }}>
        جمعنا لك كل مصادرك<br /><span style={{ color: C.coral }}>في مكان واحد</span>
      </motion.div>
      <motion.div initial={{ opacity: 0, letterSpacing: '1.2em' }} animate={{ opacity: 1, letterSpacing: '0.12em' }} transition={{ delay: 1.6, duration: 0.8 }} dir="ltr"
        style={{ fontFamily: body, fontWeight: 700, fontSize: '6vmin', color: C.mint, marginTop: '2vmin' }}>qodratak.sa</motion.div>
    </motion.div>
  );
}

function OutroScene() {
  return (
    <motion.div className="absolute inset-0" style={{ zIndex: 2 }}>
      <motion.div className="absolute rounded-full" style={{ left: '50%', top: '50%', width: '10vmin', height: '10vmin', margin: '-5vmin', background: C.paper }}
        initial={{ scale: 0 }} animate={{ scale: 32 }} transition={{ delay: 0.1, duration: 0.7, ease: [0.7, 0, 0.3, 1] }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center" dir="rtl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          style={{ fontFamily: display, fontWeight: 900, fontSize: '9vmin', color: C.ink }}>اختار قدراتك… <span style={{ color: '#E0654A' }}>وابدأ بسلام</span></motion.div>
        <motion.img src={`${B}qodratak-logo-transparent.png`} style={{ width: '34vmin', marginTop: '1.5vmin' }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.3, type: 'spring', stiffness: 240, damping: 15 }} />
        <motion.div dir="ltr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.9 }}
          style={{ fontFamily: body, fontWeight: 700, fontSize: '7vmin', color: C.navy, background: C.mint, padding: '0.6vmin 3vmin', borderRadius: '1.2vmin', marginTop: '1.6vmin' }}>qodratak.sa</motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
          style={{ fontFamily: body, fontSize: '4.4vmin', fontWeight: 700, color: '#3A3F46', marginTop: '2.4vmin', textAlign: 'center', lineHeight: 1.4 }}>منصة تدريبية مستقلة غير تابعة لقياس<br />النتائج تدريبية ولا تضمن درجة</motion.div>
      </div>
    </motion.div>
  );
}

const mkCopy = (side: 'l' | 'r', eyebrow: string, title: string, line: string, accent?: string) => () => <Copy side={side} eyebrow={eyebrow} title={title} line={line} accent={accent} />;
const SCENES: Record<string, React.ComponentType> = {
  m_hook: HookScene,
  m_gather: GatherScene,
  m_foundation: mkCopy('r', 'التأسيس', 'ابدأ من الصفر', 'كمي ولفظي خطوة بخطوة'),
  m_computerized: mkCopy('l', 'المحوسب', 'لفظي وكمي', 'بنوك أسئلة واختبارات محاكية', 'محوسب'),
  m_exam: () => (
    <motion.div className="absolute" dir="rtl" style={{ left: '5%', right: '5%', bottom: '3%', textAlign: 'center', zIndex: 2 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
        style={{ fontFamily: display, fontWeight: 900, fontSize: '7vmin', color: '#fff', background: 'rgba(13,27,42,.88)', display: 'inline-block', padding: '0.6vmin 3vmin', borderRadius: '1.4vmin' }}>محاكاة <span style={{ color: C.coral }}>تقرّبك من تجربة الاختبار</span></motion.div>
    </motion.div>
  ),
  m_results: mkCopy('r', 'التصحيح والنتائج', 'تعرف وين تغلط', 'تصحيح فوري ونتائج تفصيلية'),
  m_plans: mkCopy('l', 'خطتك', 'كل يوم خطوة', 'مهام يومية حتى موعد اختبارك', 'التحصيلي · قريبًا'),
  m_outro: OutroScene,
};

export default function MarketingLegacyTemplate({ durations = MARKETING_DURATIONS, loop = true, paused = false, muted = false, onSceneChange }: {
  durations?: Record<string, number>; loop?: boolean; paused?: boolean; muted?: boolean; onSceneChange?: (k: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey, onSceneChange]);
  const base = currentSceneKey.replace(/_r[12]$/, '');
  const Scene = SCENES[base];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    a.volume = 0.55;
    if (paused) { a.pause(); return; }
    if (lastKey.current !== currentSceneKey) {
      lastKey.current = currentSceneKey;
      const t = START_SEC[base] ?? 0;
      if (Math.abs(a.currentTime - t) > 0.18) a.currentTime = t;
    }
    a.play().catch(() => {});
  }, [currentSceneKey, base, muted, paused]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas aspectRatio="16:9" style={{ backgroundColor: C.navy }}>
        <Grain />
        <MarketingStage sceneKey={base} mountKey={currentSceneKey} />
        <AnimatePresence mode="popLayout">{Scene && <Scene key={currentSceneKey} />}</AnimatePresence>
        <audio ref={audioRef} src={`${B}audio/marketing_music.mp3`} preload="auto" autoPlay muted={muted} />
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}
