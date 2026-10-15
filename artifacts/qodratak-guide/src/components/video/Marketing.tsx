/// <reference lib="dom" />
import { useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { VideoCanvas, VideoPausedContext, useVideoPlayer } from '@/lib/video';
import { C } from './Scenes';
import { TahsiliFlowScreen } from './ExtraChapters';

const B = import.meta.env.BASE_URL;
const display = "'Tajawal', sans-serif";
const body = "'IBM Plex Sans Arabic', sans-serif";
const EASE = [0.65, 0, 0.35, 1] as const;

/** Keep the musical lifts at 8.5s and 17s; marketing_music.mp3 remains unchanged. */
export const MARKETING_DURATIONS = {
  m_hook: 4500,
  m_gather: 4000,
  m_foundation: 4000,
  m_practice: 4500,
  m_exam: 5000,
  m_results: 3500,
  m_plans: 5500,
  m_outro: 5000,
};

const START_SEC: Record<string, number> = (() => {
  const starts: Record<string, number> = {};
  let elapsed = 0;
  for (const [key, duration] of Object.entries(MARKETING_DURATIONS)) {
    starts[key] = elapsed / 1000;
    elapsed += duration;
  }
  return starts;
})();

type Pin = { x: number; y: number; at: number };
type Shot = {
  src?: string;
  visual?: 'tahsili-path';
  url: string;
  crop?: boolean;
  focus: [number, number];
  zoom: number;
  at: number;
  pins?: Pin[];
};
type Pose = { left: number; top: number; width: number; opacity: number };
type StagePlan = { pose: Pose; shots: Shot[] };

const STAGE: Record<string, StagePlan> = {
  m_hook: { pose: { left: 50, top: 50, width: 40, opacity: 0 }, shots: [] },
  m_gather: { pose: { left: 24, top: 61, width: 0.1, opacity: 0 }, shots: [] },
  m_foundation: {
    pose: { left: 3, top: 18, width: 57, opacity: 1 },
    shots: [{
      src: 'foundation.jpg', crop: true, url: '/foundation', focus: [54, 56], zoom: 1.18, at: 0,
      pins: [
        { x: 72, y: 70, at: 1.05 },
        { x: 61, y: 70, at: 1.8 },
      ],
    }],
  },
  m_practice: {
    pose: { left: 4, top: 17, width: 57, opacity: 1 },
    shots: [{
      src: 'n-mock.jpg', url: '/mock-exams', focus: [60, 46], zoom: 1.1, at: 0,
      pins: [
        { x: 82, y: 44, at: 0.65 },
        { x: 61, y: 44, at: 1.45 },
        { x: 42, y: 44, at: 2.25 },
      ],
    }],
  },
  m_exam: {
    pose: { left: 15, top: 3, width: 70, opacity: 1 },
    shots: [
      { src: 'n-exam-instr.jpg', url: '/qiyas-exam', focus: [52, 52], zoom: 1.05, at: 0 },
      {
        src: 'n-exam-answer.jpg', url: '/qiyas-exam', focus: [48, 42], zoom: 1.06, at: 1.8,
        pins: [
          { x: 8, y: 7, at: 0.25 },
          { x: 58, y: 32, at: 0.85 },
          { x: 9, y: 43, at: 1.4 },
        ],
      },
      {
        src: 'n-exam-q2.jpg', url: '/qiyas-exam', focus: [58, 42], zoom: 1.1, at: 3.5,
        pins: [
          { x: 61, y: 23, at: 0.25 },
          { x: 48, y: 94, at: 0.95 },
        ],
      },
    ],
  },
  m_results: {
    pose: { left: 4, top: 10, width: 57, opacity: 1 },
    shots: [{ src: 'n-records.jpg', url: '/records', focus: [53, 27], zoom: 1.15, at: 0 }],
  },
  m_plans: {
    pose: { left: 4, top: 13, width: 57, opacity: 1 },
    shots: [{ visual: 'tahsili-path', url: '/student-program/tahsili', focus: [50, 50], zoom: 1.04, at: 0 }],
  },
  m_outro: { pose: { left: 50, top: 50, width: 40, opacity: 0 }, shots: [] },
};

function FilmTexture() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{
      background: `radial-gradient(ellipse at 8% 84%, ${C.mint}18, transparent 33%), radial-gradient(ellipse at 92% 8%, ${C.coral}18, transparent 37%)`,
    }} />
  );
}

function useShotIndex(sceneKey: string, shots: Shot[], paused: boolean) {
  const [position, setPosition] = useState({ sceneKey, index: 0 });
  const index = position.sceneKey === sceneKey ? position.index : 0;

  useEffect(() => {
    if (position.sceneKey !== sceneKey) {
      setPosition({ sceneKey, index: 0 });
      return;
    }
    const next = shots[index + 1];
    if (paused || !next) return;
    const now = shots[index]?.at ?? 0;
    const delayMs = Math.max(0, (next.at - now) * 1000);
    const timer = window.setTimeout(() => setPosition({ sceneKey, index: index + 1 }), delayMs);
    return () => window.clearTimeout(timer);
  }, [index, paused, position.sceneKey, sceneKey, shots]);

  return index;
}

function ShotPlane({ shot, hold }: { shot: Shot; hold: number }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={{ background: C.paper }}
      initial={{ opacity: 0, clipPath: 'inset(0 8% 0 8% round 2%)' }}
      animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0% round 0%)' }}
      exit={{ opacity: 0, scale: 1.025, transition: { duration: 0.28 } }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="absolute left-0 w-full"
        style={{ top: shot.crop ? '-6.6%' : 0, transformOrigin: `${shot.focus[0]}% ${shot.focus[1]}%` }}
        initial={{ scale: 1.025 }}
        animate={{ scale: shot.zoom }}
        transition={{ duration: Math.max(hold, 0.45), ease: [0.45, 0, 0.25, 1] }}
      >
        {shot.visual === 'tahsili-path'
          ? <>
              <TahsiliFlowScreen />
              <div style={{ position: 'absolute', left: '1.2vmin', bottom: '0.9vmin', fontFamily: body, fontWeight: 700, fontSize: '1.5vmin', color: '#fff', background: 'rgba(13,27,42,.78)', padding: '0.35vmin 1vmin', borderRadius: '0.7vmin' }}>عرض توضيحي لمسار الطالب</div>
            </>
          : <img src={`${B}shots/${shot.src}`} className="block w-full" alt="" draggable={false} />}
        {shot.pins?.map((pin) => (
          <div key={`${pin.x}-${pin.y}`} className="absolute" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
            <motion.div
              className="absolute rounded-full"
              style={{ width: '2.4vmin', height: '2.4vmin', margin: '-1.2vmin', border: `0.42vmin solid ${C.coral}`, background: `${C.coral}35` }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.35, 1] }}
              transition={{ delay: pin.at, duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function BrowserStage({ sceneKey, mountKey }: { sceneKey: string; mountKey: string }) {
  const paused = useContext(VideoPausedContext);
  const plan = STAGE[sceneKey] ?? STAGE.m_hook;
  const index = useShotIndex(sceneKey, plan.shots, paused);
  const shot = plan.shots[index];
  const hold = shot
    ? ((plan.shots[index + 1]?.at ?? MARKETING_DURATIONS[sceneKey as keyof typeof MARKETING_DURATIONS] / 1000) - shot.at)
    : 0;
  const pose = plan.pose;
  const baseWidth = 74;

  return (
    <motion.div
      className="absolute"
      style={{ left: 0, top: 0, width: `${baseWidth}%`, aspectRatio: '16/9', transformOrigin: '0 0', zIndex: 1 }}
      initial={false}
      animate={{
        x: `${(pose.left / baseWidth) * 100}%`,
        y: `${(pose.top / baseWidth) * 100}%`,
        scale: pose.width / baseWidth,
        opacity: pose.opacity,
      }}
      transition={{ duration: 0.8, ease: EASE, opacity: { duration: 0.45 } }}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden"
        style={{ borderRadius: '1.15vmin', background: '#E9E4DA', boxShadow: '0 3vmin 8vmin rgba(0,0,0,.38)' }}
      >
        <div className="flex shrink-0 items-center gap-[0.85vmin] px-[1.25vmin]" dir="ltr" style={{ height: '4.2vmin' }}>
          {[C.coral, '#E7BE62', C.mint].map((color) => (
            <span key={color} style={{ width: '0.95vmin', height: '0.95vmin', borderRadius: '50%', background: color }} />
          ))}
          <div className="relative mx-[4vmin] h-[2.7vmin] flex-1 overflow-hidden rounded-full" style={{ background: C.paper }}>
            <AnimatePresence initial={false}>
              {shot && (
                <motion.div
                  key={`${mountKey}-${index}`}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ fontFamily: body, fontSize: '2vmin', fontWeight: 700, color: '#555B60' }}
                  initial={{ opacity: 0, y: '60%' }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: '-60%' }}
                  transition={{ duration: 0.24 }}
                >
                  qodratak.sa{shot.url}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden" style={{ background: C.paper }}>
          <AnimatePresence initial={false}>
            {shot && <ShotPlane key={`${mountKey}-${index}`} shot={shot} hold={hold} />}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function Copy({
  side, eyebrow, title, line, compact = false,
}: {
  side: 'left' | 'right'; eyebrow: string; title: string; line: string; compact?: boolean;
}) {
  return (
    <motion.div
      className="absolute"
      dir="rtl"
      style={{ [side]: '5%', width: '29%', top: compact ? '26%' : '24%', textAlign: 'right', zIndex: 2 }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.25 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        style={{ fontFamily: body, fontWeight: 700, fontSize: '2.5vmin', color: C.mint, marginBottom: '1.2vmin' }}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.12, duration: 0.32 }}
      >
        {eyebrow}
      </motion.div>
      <div className="overflow-hidden pb-[0.5vmin]">
        <motion.div
          style={{ fontFamily: display, fontWeight: 900, fontSize: '7.5vmin', lineHeight: 1.12, color: C.paper }}
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          transition={{ delay: 0.18, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          {title}
        </motion.div>
      </div>
      <motion.div
        style={{ fontFamily: body, fontSize: '3.15vmin', fontWeight: 500, lineHeight: 1.4, color: '#D4DCE2', marginTop: '1.8vmin' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.35 }}
      >
        {line}
      </motion.div>
    </motion.div>
  );
}

function SceneMask({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`absolute inset-0 overflow-hidden ${className}`}
      initial={{ clipPath: 'circle(45% at 50% 50%)' }}
      animate={{ clipPath: 'circle(120% at 50% 50%)' }}
      exit={{ opacity: 0, scale: 1.015, transition: { duration: 0.3 } }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{ zIndex: 2 }}
    >
      {children}
    </motion.div>
  );
}

function HookScene() {
  return (
    <SceneMask>
      <div className="absolute inset-0" style={{ background: C.navy }} />
      <motion.div
        className="absolute flex items-center justify-center"
        dir="rtl"
        style={{ left: '5%', right: '5%', top: '20%', fontFamily: display, fontWeight: 900, fontSize: '17vmin', color: C.coral }}
        initial={{ scale: 0.74, opacity: 0, y: '8%' }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.58, ease: [0.18, 0.9, 0.24, 1] }}
      >
        من وين تبدأ؟
      </motion.div>
      <div className="absolute flex flex-row-reverse items-center justify-between" style={{ left: '10%', right: '10%', top: '55%' }} dir="rtl">
        {['تأسيس', 'تدريب', 'مراجعة'].map((label, index) => (
          <motion.div
            key={label}
            className="flex items-center gap-[1.1vmin]"
            style={{ fontFamily: body, fontSize: '3.4vmin', fontWeight: 700, color: index === 1 ? C.coral : C.mint }}
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.8 + index * 0.24, type: 'spring', stiffness: 280, damping: 19 }}
          >
            <span style={{ width: '1.5vmin', height: '1.5vmin', borderRadius: '50%', background: index === 1 ? C.coral : C.mint }} />
            {label}
          </motion.div>
        ))}
      </div>
      <motion.div
        className="absolute h-[0.4vmin]"
        style={{ left: '10%', right: '10%', top: '63%', background: C.coral, transformOrigin: 'right' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      />
    </SceneMask>
  );
}

function PathScene() {
  const labels = [
    { x: 76, label: 'تأسيس', sub: 'من الأساس' },
    { x: 50, label: 'تدريب', sub: 'لفظي وكمي' },
    { x: 24, label: 'مراجعة', sub: 'نتائج المحاولة' },
  ];
  return (
    <SceneMask>
      <div className="absolute inset-0" style={{ background: C.navy }} />
      <motion.div
        dir="rtl"
        className="absolute inset-x-[8%] top-[12%] text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.42 }}
      >
        <div style={{ fontFamily: display, fontWeight: 900, fontSize: '10vmin', color: C.paper }}>خطوات واضحة</div>
        <div style={{ fontFamily: body, fontWeight: 500, fontSize: '3.3vmin', color: C.mint, marginTop: '0.7vmin' }}>
          للاستعداد لاختبار القدرات
        </div>
      </motion.div>
      <svg className="absolute left-[8%] top-[27%] h-[55%] w-[84%]" viewBox="0 0 1000 500" aria-hidden="true">
        <motion.path
          d="M760 310 C680 278 600 278 500 310 C400 342 315 342 240 310"
          fill="none"
          stroke={C.coral}
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.48, duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        />
        {labels.map((item, index) => (
          <g key={item.label}>
            <motion.circle
              cx={item.x * 10}
              cy="310"
              r="12"
              fill={index === 1 ? C.coral : C.mint}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.82 + index * 0.38, type: 'spring', stiffness: 290, damping: 17 }}
            />
            <foreignObject x={item.x * 10 - 105} y="355" width="210" height="112">
              <motion.div
                dir="rtl"
                style={{ textAlign: 'center', fontFamily: display, fontWeight: 900, fontSize: '34px', color: index === 1 ? C.coral : C.paper }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.95 + index * 0.38, duration: 0.3 }}
              >
                {item.label}
                <span style={{ display: 'block', marginTop: '4px', fontFamily: body, fontWeight: 500, fontSize: '21px', color: '#CAD3D9' }}>{item.sub}</span>
              </motion.div>
            </foreignObject>
          </g>
        ))}
      </svg>
      <motion.div
        className="absolute bottom-[8%] left-[10%] h-[0.3vmin] w-[80%]"
        style={{ background: C.mint, transformOrigin: 'right', opacity: 0.7 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 2.8, duration: 0.65 }}
      />
    </SceneMask>
  );
}

function ExamCaption() {
  return (
    <motion.div
      className="absolute text-center"
      dir="rtl"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
      transition={{ delay: 0.3, duration: 0.38 }}
      style={{ left: '8%', right: '8%', top: '80%', zIndex: 3 }}
    >
      <span style={{ display: 'block', width: 'fit-content', margin: '0 auto', fontFamily: display, fontWeight: 900, fontSize: '6.7vmin', lineHeight: 1.25, color: C.paper, background: 'rgba(13,27,42,.94)', padding: '0.8vmin 2.8vmin', borderRadius: '1.2vmin' }}>
        جرّب واجهة الاختبار
      </span>
      <div style={{ display: 'block', width: 'fit-content', maxWidth: '100%', margin: '0.65vmin auto 0', fontFamily: body, fontWeight: 700, fontSize: '3vmin', color: C.paper, background: 'rgba(13,27,42,.92)', padding: '0.5vmin 1.7vmin', borderRadius: '0.7vmin' }}>
        مؤقت · سؤال واحد في كل شاشة · خريطة للأسئلة
      </div>
    </motion.div>
  );
}

function OutroScene() {
  return (
    <SceneMask className="bg-[#F7F4EE]">
      <motion.div
        className="absolute rounded-full"
        style={{ left: '50%', top: '50%', width: '8vmin', height: '8vmin', margin: '-4vmin', background: C.paper }}
        initial={{ scale: 0 }}
        animate={{ scale: 28 }}
        transition={{ duration: 0.7, ease: [0.7, 0, 0.3, 1] }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center" dir="rtl">
        <motion.div
          style={{ fontFamily: display, fontWeight: 900, fontSize: '8.5vmin', color: C.ink, textAlign: 'center' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.4 }}
        >
          طريقك يبدأ بخطوة
        </motion.div>
        <motion.img
          src={`${B}qodratak-logo-transparent.png`}
          alt=""
          style={{ width: '36vmin', marginTop: '1vmin' }}
          initial={{ opacity: 0, scale: 0.78 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.78, type: 'spring', stiffness: 230, damping: 17 }}
        />
        <motion.div
          dir="rtl"
          style={{ fontFamily: display, fontWeight: 900, fontSize: '4.3vmin', color: C.navy, background: C.coral, padding: '0.6vmin 2.4vmin', borderRadius: '0.8vmin', marginTop: '1vmin' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.22, duration: 0.34 }}
        >
          ابدأ تجربتك المجانية · ٣ أيام
        </motion.div>
        <motion.div
          dir="ltr"
          style={{ fontFamily: body, fontWeight: 700, fontSize: '3.4vmin', color: '#54766D', letterSpacing: '0.08em', marginTop: '0.9vmin' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.55, duration: 0.32 }}
        >
          qodratak.sa
        </motion.div>
        <motion.div
          style={{ fontFamily: body, fontSize: '2.45vmin', fontWeight: 600, color: '#555B60', marginTop: '2vmin', textAlign: 'center', lineHeight: 1.45 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9, duration: 0.32 }}
        >
          منصة تدريبية مستقلة غير تابعة لقياس<br />
          النتائج تدريبية ولا تضمن درجة
        </motion.div>
        <motion.div
          className="absolute left-1/2 top-1/2 h-[1vmin] w-[1vmin] rounded-full"
          style={{ background: C.navy }}
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: [1, 1, 0], opacity: [0, 0.6, 1] }}
          transition={{ delay: 4.5, duration: 0.45, ease: 'easeIn' }}
        />
      </div>
    </SceneMask>
  );
}

const SCENES: Record<string, React.ComponentType> = {
  m_hook: HookScene,
  m_gather: PathScene,
  m_foundation: () => (
    <SceneMask>
      <Copy side="right" eyebrow="التأسيس" title="ابدأ من الأساس" line="اختر الكمي أو اللفظي وابدأ" />
    </SceneMask>
  ),
  m_practice: () => (
    <SceneMask>
      <Copy side="right" eyebrow="تدريب القدرات" title="تدرّب على اختيارك" line="لفظي ٦٥ · كمي ٥٥ · شامل ١٢٠ سؤالًا" compact />
    </SceneMask>
  ),
  m_exam: () => (
    <SceneMask>
      <ExamCaption />
    </SceneMask>
  ),
  m_results: () => (
    <SceneMask>
      <Copy side="right" eyebrow="بعد المحاولة" title="راجع نتيجتك" line="نتائج تدريبية داخل المنصة، وليست درجة قياس الرسمية" compact />
    </SceneMask>
  ),
  m_plans: () => (
    <SceneMask>
      <Copy side="right" eyebrow="مسار التحصيلي" title="ابدأ بالمادة" line="ادرس، طبّق، ثم اختبر جاهزيتك" compact />
    </SceneMask>
  ),
  m_outro: OutroScene,
};

export default function MarketingTemplate({
  durations = MARKETING_DURATIONS,
  loop = true,
  paused = false,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  paused?: boolean;
  muted?: boolean;
  onSceneChange?: (key: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey, onSceneChange]);
  const sceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const Scene = SCENES[sceneKey];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.53;
    if (paused) {
      audio.pause();
      return;
    }
    if (lastKey.current !== currentSceneKey) {
      lastKey.current = currentSceneKey;
      audio.currentTime = START_SEC[sceneKey] ?? 0;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, muted, paused, sceneKey]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas aspectRatio="16:9" style={{ backgroundColor: C.navy }}>
        <FilmTexture />
        <BrowserStage sceneKey={sceneKey} mountKey={currentSceneKey} />
        <AnimatePresence mode="sync">
          {Scene && <Scene key={currentSceneKey} />}
        </AnimatePresence>
        <audio ref={audioRef} src={`${B}audio/marketing_music.mp3`} preload="auto" autoPlay muted={muted} />
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}
