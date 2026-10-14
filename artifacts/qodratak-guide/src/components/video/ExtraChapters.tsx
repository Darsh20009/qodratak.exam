/// <reference lib="dom" />
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoCanvas, useVideoPlayer, VideoPausedContext } from '@/lib/video';
import { C } from './Scenes';

/**
 * Chapter-only clips (?chapter=KEY) for pages outside the 72 s guide.
 * Copy and labels are taken from the real page implementations in artifacts/qodratak/src/pages.
 * Only /notifications has a real capture (n-notif.jpg); the other pages are behind sign-in, so they are
 * shown as labelled illustrative panels built from those pages' actual labels, never as invented screens.
 */
const B = import.meta.env.BASE_URL;
const display = "'Tajawal', sans-serif";
const body = "'IBM Plex Sans Arabic', sans-serif";

export const EXTRA_DURATIONS = {
  flashcards: 7500, analysis: 7500, mistakes: 7500, security: 7500,
  preexam: 7500, tutor: 7500, rooms: 7500, notifications: 7500,
};
/** Offsets into the existing bg_music_full.mp3 (no new music). */
const AUDIO_AT: Record<string, number> = { flashcards: 4.5, analysis: 13, mistakes: 21, security: 29.5, preexam: 39.5, tutor: 50, rooms: 58.5, notifications: 62.5 };

/* ---------- small UI primitives for illustrative panels ---------- */
const ink = '#1F2933';
function Chip({ t, on }: { t: string; on?: boolean }) {
  return <span style={{ fontFamily: body, fontWeight: 700, fontSize: '2.4vmin', padding: '0.6vmin 1.6vmin', borderRadius: '1vmin', background: on ? C.navy : '#ECE7DD', color: on ? '#fff' : ink }}>{t}</span>;
}
function Tile({ k, v, tone = C.mint }: { k: string; v: string; tone?: string }) {
  return (
    <div style={{ flex: 1, background: '#fff', border: '0.25vmin solid #E4DED2', borderRadius: '1.4vmin', padding: '1.4vmin', textAlign: 'center' }}>
      <div style={{ fontFamily: display, fontWeight: 900, fontSize: '4.2vmin', color: ink, borderBottom: `0.5vmin solid ${tone}`, display: 'inline-block' }}>{v}</div>
      <div style={{ fontFamily: body, fontWeight: 600, fontSize: '2.2vmin', color: '#56606B', marginTop: '0.6vmin' }}>{k}</div>
    </div>
  );
}
function Row({ t, s, on }: { t: string; s?: string; on?: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{ background: '#fff', border: '0.25vmin solid #E4DED2', borderRadius: '1.2vmin', padding: '1.2vmin 1.6vmin' }}>
      <div><div style={{ fontFamily: display, fontWeight: 800, fontSize: '2.7vmin', color: ink }}>{t}</div>{s && <div style={{ fontFamily: body, fontSize: '2vmin', color: '#56606B' }}>{s}</div>}</div>
      <span style={{ width: '6vmin', height: '3.2vmin', borderRadius: '2vmin', background: on ? '#2E9C7E' : '#D5CFC4', position: 'relative' }}>
        <span style={{ position: 'absolute', top: '0.4vmin', [on ? 'left' : 'right']: '0.4vmin', width: '2.4vmin', height: '2.4vmin', borderRadius: '50%', background: '#fff' }} />
      </span>
    </div>
  );
}
function Btn({ t, tone = C.navy, fg = '#fff' }: { t: string; tone?: string; fg?: string }) {
  return <div style={{ textAlign: 'center', fontFamily: display, fontWeight: 900, fontSize: '2.8vmin', background: tone, color: fg, borderRadius: '1.2vmin', padding: '1.2vmin' }}>{t}</div>;
}
function H({ t }: { t: string }) {
  return <div style={{ fontFamily: display, fontWeight: 900, fontSize: '4vmin', color: ink }}>{t}</div>;
}
const col = (gap = '1.4vmin'): React.CSSProperties => ({ display: 'flex', flexDirection: 'column', gap });
const rowS = (gap = '1vmin'): React.CSSProperties => ({ display: 'flex', gap, flexWrap: 'wrap' });

type Clip = { url: string; eyebrow: string; title: string; bullets: string[]; note?: string; shot?: string; panel?: () => React.ReactNode };

const CLIPS: Record<string, Clip> = {
  flashcards: {
    url: '/flashcards', eyebrow: 'المحوسب · مراجعة سريعة', title: 'البطاقات التعليمية',
    bullets: ['فلتر: لفظي أو كمي، ومستوى الصعوبة', 'اقلب البطاقة لترى التفسير', '«عرفتها» أو «لم أعرفها» أو اسحب'],
    panel: () => (
      <div style={col()}>
        <div style={rowS()}><Chip t="الكل" /><Chip t="لفظي" on /><Chip t="كمي" /><Chip t="سهل" /><Chip t="متوسط" on /><Chip t="صعب" /></div>
        <div style={{ position: 'relative', height: '19vmin', background: '#fff', border: `0.4vmin solid ${C.mint}`, borderRadius: '2vmin' }}>
          <motion.div className="absolute inset-0 grid place-items-center" initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 0] }} transition={{ duration: 2.6, times: [0, 0.8, 1], delay: 1 }}
            style={{ fontFamily: display, fontWeight: 900, fontSize: '3.6vmin', color: ink }}>بطاقة سؤال من بنك الأسئلة</motion.div>
          <motion.div className="absolute inset-0 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 3.4 }}
            style={{ fontFamily: display, fontWeight: 900, fontSize: '3.6vmin', color: '#2E9C7E' }}>التفسير: …</motion.div>
        </div>
        <div style={rowS('1.4vmin')}><div style={{ flex: 1 }}><Btn t="عرفتها" tone="#2E9C7E" /></div><div style={{ flex: 1 }}><Btn t="لم أعرفها" tone="#D9604A" /></div></div>
      </div>
    ),
  },
  analysis: {
    url: '/performance-report', eyebrow: 'نتائجي', title: 'تقرير الأداء',
    bullets: ['إجمالي الأسئلة ومعدل الإجابات', 'اللفظي والكمي كلٌ على حدة', 'نزّل تقريرك الشخصي PDF'],
    note: 'أرقام تدريبية من نشاطك داخل المنصة',
    panel: () => (
      <div style={col()}>
        <H t="تقرير الأداء الأكاديمي" />
        <div style={rowS('1.2vmin')}><Tile k="إجمالي الأسئلة" v="—" /><Tile k="معدل الإجابات" v="—" tone={C.coral} /><Tile k="سلسلة الأيام" v="—" /></div>
        {['القسم اللفظي', 'القسم الكمي'].map((t, i) => (
          <div key={t}><div style={{ fontFamily: body, fontWeight: 700, fontSize: '2.4vmin', color: ink }}>{t}</div>
            <div style={{ height: '1.8vmin', background: '#E4DED2', borderRadius: '1vmin', overflow: 'hidden' }}>
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: i ? 0.48 : 0.63 }} transition={{ delay: 1.6 + i * 0.4, duration: 0.9 }} style={{ height: '100%', background: i ? C.coral : '#2E9C7E', transformOrigin: 'right' }} />
            </div></div>
        ))}
        <Btn t="تنزيل PDF" />
      </div>
    ),
  },
  mistakes: {
    url: '/mistake-challenge', eyebrow: 'نتائجي · بعد الاختبار', title: 'تحدي الأخطاء',
    bullets: ['يبدأ من نتيجة اختبار بأسئلتك الخاطئة', 'اختر الوضع: السرعة، البقاء، الزن…', 'أعد حلّها واعرف نسبتك ونقاطك'],
    note: 'يفتح بعد اختبار فيه أخطاء',
    panel: () => (
      <div style={col('1.1vmin')}>
        <H t="تحدي الأخطاء" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1vmin' }}>
          {[['شيطان السرعة', 'أقل وقت ممكن'], ['وضع البقاء', '3 أرواح فقط'], ['سيد الزن', 'بدون ضغط وقت'], ['وضع المحارب', 'قوى خاصة'], ['الكمالي', '100% أو من جديد'], ['وضع المغامرة', 'مستويات وقصة']].map(([t, d], i) => (
            <motion.div key={t} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: i === 1 ? [0.9, 1, 1, 1.05] : 1 }} transition={{ delay: 0.6 + i * 0.12, duration: i === 1 ? 2.4 : 0.35 }}
              style={{ background: '#fff', borderRadius: '1.2vmin', padding: '1vmin 1.2vmin', border: i === 1 ? `0.4vmin solid ${C.coral}` : '0.25vmin solid #E4DED2' }}>
              <div style={{ fontFamily: display, fontWeight: 900, fontSize: '2.6vmin', color: ink }}>{t}</div>
              <div style={{ fontFamily: body, fontWeight: 600, fontSize: '2vmin', color: '#56606B' }}>{d}</div>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.6 }} style={rowS('1.2vmin')}>
          <Tile k="النسبة المئوية" v="—" /><Tile k="الإجابات الصحيحة" v="—" tone={C.coral} /><Tile k="النقاط المكتسبة" v="—" />
        </motion.div>
      </div>
    ),
  },
  security: {
    url: '/security-settings', eyebrow: 'حسابي', title: 'الأمان والخصوصية',
    bullets: ['تطبيق المصادقة (TOTP)', 'رمز PIN سريع وبصمة Passkey', 'عبارة استرداد احتياطية'],
    panel: () => (
      <div style={col('1.1vmin')}>
        <H t="الأمان والخصوصية" />
        <Row t="تطبيق المصادقة (TOTP)" s="التحقق الثنائي" on />
        <Row t="رمز PIN السريع" s="4-8 أرقام" />
        <Row t="بصمة الإصبع أو الوجه (Passkey)" />
        <Row t="رمز عبر البريد الإلكتروني" s="متاح دائماً" on />
        <Row t="عبارة الاسترداد الاحتياطية" />
      </div>
    ),
  },
  preexam: {
    url: '/pre-exam-day', eyebrow: 'قبل الاختبار', title: 'مراجعة الليلة الأخيرة',
    bullets: ['جلسة مراجعة لفظي وكمي بمؤقت', 'تعرف الأقوى وما يحتاج تركيز', 'نصائح: نم مبكرًا ولا تحفظ جديدًا'],
    panel: () => (
      <div style={col()}>
        <div style={rowS('1.2vmin')}><Tile k="لفظي" v="—" /><Tile k="كمي" v="—" tone={C.coral} /><Tile k="الوقت" v="ساعتان" /></div>
        <div style={rowS('1.2vmin')}>
          <div style={{ flex: 1, background: '#E3F4EE', borderRadius: '1.2vmin', padding: '1.2vmin', fontFamily: display, fontWeight: 800, fontSize: '2.7vmin', color: ink }}>الأقوى</div>
          <div style={{ flex: 1, background: '#FBE5DF', borderRadius: '1.2vmin', padding: '1.2vmin', fontFamily: display, fontWeight: 800, fontSize: '2.7vmin', color: ink }}>يحتاج تركيز</div>
        </div>
        {['نم مبكراً الليلة ولا تسهر للدراسة', 'لا تحفظ معلومات جديدة — ركّز على التثبيت', 'اقرأ كل سؤال مرتين قبل الإجابة'].map((t, i) => (
          <motion.div key={t} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.8 + i * 0.5 }}
            style={{ fontFamily: body, fontWeight: 600, fontSize: '2.5vmin', color: ink, background: '#fff', borderRadius: '1vmin', padding: '0.9vmin 1.4vmin' }}>{t}</motion.div>
        ))}
      </div>
    ),
  },
  tutor: {
    url: '/ai-tutor', eyebrow: 'نتائجي · مساعد', title: 'مساعد قدراتك',
    bullets: ['أسئلة سريعة: حلّل أدائي، خطة دراسة', 'اكتب سؤالك عن اللفظي أو الكمي', 'إرشاد مساعد، وليس بديلًا عن مراجعتك'],
    panel: () => (
      <div style={col('1.1vmin')}>
        <div className="flex items-center justify-between"><H t="مساعد قدراتك" /><span style={{ fontFamily: body, fontWeight: 700, fontSize: '2.2vmin', color: '#2E9C7E' }}>● متصل الآن</span></div>
        <div style={rowS()}>{['حلّل أدائي', 'خطة دراسة', 'نصائح القياس', 'إدارة الوقت'].map((t) => <Chip key={t} t={t} />)}</div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}
          style={{ alignSelf: 'flex-start', background: C.navy, color: '#fff', fontFamily: body, fontWeight: 600, fontSize: '2.5vmin', padding: '1vmin 1.6vmin', borderRadius: '1.4vmin' }}>ما أفضل استراتيجية لإدارة الوقت؟</motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6 }}
          style={{ alignSelf: 'flex-end', width: '70%', background: '#fff', borderRadius: '1.4vmin', padding: '1.2vmin', display: 'flex', flexDirection: 'column', gap: '0.8vmin' }}>
          {[0.9, 0.75, 0.55].map((w) => <span key={w} style={{ height: '1.4vmin', width: `${w * 100}%`, background: '#E4DED2', borderRadius: '1vmin' }} />)}
        </motion.div>
        <div style={{ fontFamily: body, fontSize: '2.4vmin', color: '#7A838C', background: '#fff', border: '0.25vmin solid #E4DED2', borderRadius: '1.2vmin', padding: '1vmin 1.6vmin' }}>اكتب سؤالك هنا...</div>
      </div>
    ),
  },
  rooms: {
    url: '/study-rooms', eyebrow: 'المحوسب · مع أصدقائك', title: 'غرف المذاكرة',
    bullets: ['أنشئ غرفة: لفظي أو كمي أو مختلط', 'شارك رمز الغرفة (6 أحرف)', 'عدّ تنازلي ثم تتنافسون معًا'],
    panel: () => (
      <div style={col()}>
        <div style={{ fontFamily: body, fontWeight: 600, fontSize: '2.5vmin', color: '#56606B' }}>احجز وقتاً مع أصدقائك وتنافسوا معاً</div>
        <div style={rowS()}><Chip t="مختلط" on /><Chip t="لفظي" /><Chip t="كمي" /></div>
        <div style={{ background: '#fff', borderRadius: '1.4vmin', padding: '1.4vmin', textAlign: 'center' }}>
          <div style={{ fontFamily: body, fontWeight: 700, fontSize: '2.2vmin', color: '#56606B' }}>رمز الغرفة</div>
          <div dir="ltr" style={{ fontFamily: "'IBM Plex Sans Arabic', monospace", fontWeight: 700, fontSize: '5vmin', letterSpacing: '0.4em', color: ink }}>••••••</div>
        </div>
        <div style={rowS('1.2vmin')}>{['ساعة', 'دقيقة', 'ثانية'].map((t) => <Tile key={t} k={t} v="00" />)}</div>
        <Btn t="انضم للغرفة" tone="#2E9C7E" />
      </div>
    ),
  },
  notifications: {
    url: '/notifications', eyebrow: 'حسابي', title: 'الإشعارات',
    bullets: ['فلتر: غير المقروء، اختبار، إنجاز، تنبيه', 'تذكير قبل الاختبار وتقرير أسبوعي', 'اربط تيليجرام من إعدادات الإشعارات'],
    shot: 'n-notif.jpg',
  },
};

function Frame({ clip }: { clip: Clip }) {
  return (
    <motion.div className="absolute" style={{ left: '3%', top: '17%', width: '56%', aspectRatio: '16/9', zIndex: 1 }}
      initial={{ y: '6%', opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
      <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ borderRadius: '1.2vmin', background: '#E9E4DA', boxShadow: '0 4vmin 9vmin rgba(0,0,0,.45)' }}>
        <div className="flex items-center shrink-0" dir="ltr" style={{ height: '5.4vmin', padding: '0 1.6vmin', gap: '1vmin' }}>
          {['#FF8A70', '#F2C96B', '#91D7C5'].map((c) => <span key={c} style={{ width: '1.1vmin', height: '1.1vmin', borderRadius: '50%', background: c }} />)}
          <div className="flex items-center justify-center" style={{ flex: 1, margin: '0 6vmin', height: '4vmin', borderRadius: '2vmin', background: C.paper, fontFamily: body, fontSize: '3.2vmin', fontWeight: 700, color: '#2E343B' }}>
            qodratak.sa{clip.url}
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden" style={{ background: '#F4F1EA' }}>
          {clip.shot ? (
            <motion.img src={`${B}shots/${clip.shot}`} className="block w-full" style={{ transformOrigin: '60% 20%' }}
              initial={{ scale: 1.02 }} animate={{ scale: 1.5 }} transition={{ duration: 6.5, ease: [0.45, 0, 0.25, 1] }} />
          ) : (
            <div dir="rtl" style={{ padding: '1.6vmin 2.6vmin', transform: 'scale(0.9)', transformOrigin: '50% 0' }}>{clip.panel?.()}</div>
          )}
          {!clip.shot && (
            <div style={{ position: 'absolute', left: '1.4vmin', bottom: '1.2vmin', fontFamily: body, fontWeight: 700, fontSize: '2vmin', color: '#fff', background: 'rgba(13,27,42,.75)', padding: '0.3vmin 1.2vmin', borderRadius: '0.8vmin' }}>رسم توضيحي من الصفحة</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ClipScene({ k }: { k: string }) {
  const clip = CLIPS[k];
  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, transition: { duration: 0.35 } }}>
      <Frame clip={clip} />
      <div className="absolute" dir="rtl" style={{ right: '4.5%', width: '36%', top: '12%', textAlign: 'right', zIndex: 2 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ fontFamily: display, fontWeight: 800, fontSize: '4vmin', color: C.mint }}>{clip.eyebrow}</motion.div>
        <div style={{ overflow: 'hidden', paddingBottom: '0.6vmin' }}>
          <motion.div initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: display, fontWeight: 900, fontSize: '9vmin', lineHeight: 1.2, color: '#fff' }}>{clip.title}</motion.div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8vmin', marginTop: '2vmin' }}>
          {clip.bullets.map((b, i) => (
            <motion.div key={b} className="flex items-start" style={{ gap: '1.4vmin' }}
              initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 + i * 1.3, duration: 0.45 }}>
              <span style={{ flexShrink: 0, fontFamily: display, fontWeight: 900, fontSize: '3.4vmin', background: C.coral, color: C.ink, borderRadius: '0.9vmin', padding: '0 1.2vmin' }}>{['١', '٢', '٣'][i]}</span>
              <span style={{ fontFamily: body, fontWeight: 600, fontSize: '4.6vmin', lineHeight: 1.3, color: '#E3E9EE' }}>{b}</span>
            </motion.div>
          ))}
        </div>
        {clip.note && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5 }}
            style={{ fontFamily: body, fontWeight: 600, fontSize: '3.2vmin', color: '#9FB0BF', marginTop: '2.4vmin' }}>{clip.note}</motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function ExtraChapterTemplate({ durations = { flashcards: EXTRA_DURATIONS.flashcards }, loop = true, paused = false, muted = false, onSceneChange }: {
  durations?: Record<string, number>; loop?: boolean; paused?: boolean; muted?: boolean; onSceneChange?: (k: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey, onSceneChange]);
  const base = currentSceneKey.replace(/_r[12]$/, '');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    a.volume = 0.5;
    if (paused) { a.pause(); return; }
    if (lastKey.current !== currentSceneKey) {
      lastKey.current = currentSceneKey;
      const t = AUDIO_AT[base] ?? 0;
      if (Math.abs(a.currentTime - t) > 0.18) a.currentTime = t;
    }
    a.play().catch(() => {});
  }, [currentSceneKey, base, muted, paused]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas aspectRatio="16:9" style={{ backgroundColor: C.navy }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 12% 18%, ${C.mint}22, transparent 34%), radial-gradient(circle at 88% 100%, ${C.coral}26, transparent 40%)` }} />
        <AnimatePresence mode="popLayout">{CLIPS[base] && <ClipScene key={currentSceneKey} k={base} />}</AnimatePresence>
        <audio ref={audioRef} src={`${B}audio/bg_music_full.mp3`} preload="auto" autoPlay muted={muted} />
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}
