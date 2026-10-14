import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, Repeat, Volume2, VolumeX } from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS, GUIDE_DURATIONS } from './VideoTemplate';
import RoleFilmTemplate, { ROLE_FILMS, roleDurations, type Role } from './RoleFilms';
import { ViewerProvider } from './viewer';
import MarketingTemplate, { MARKETING_DURATIONS } from './Marketing';
import ExtraChapterTemplate, { EXTRA_DURATIONS } from './ExtraChapters';
import { useSceneControls } from './useSceneControls';

const F = 'src/components/video/Scenes.tsx';
const SCENE_DETAILS: Record<string, { title: string; filePath: string }> = {
  intro: { title: 'المقدمة', filePath: F }, dashboard: { title: 'لوحتي', filePath: F },
  course: { title: 'دورتي', filePath: F }, today: { title: 'مهام اليوم', filePath: F },
  foundation: { title: 'التأسيس', filePath: F }, book: { title: 'كتاب التأسيس', filePath: F },
  computerized: { title: 'المحوسب', filePath: F }, results: { title: 'نتائجي', filePath: F },
  account: { title: 'حسابي', filePath: F }, outro: { title: 'الخاتمة', filePath: F },
  m_hook: { title: 'ليه مشتّت؟', filePath: 'src/components/video/Marketing.tsx' },
};

function announce(index: number, keys: string[]) {
  const d = SCENE_DETAILS[keys[index]];
  if (!d?.filePath) return;
  window.parent.postMessage({ type: 'REPLIT_VIDEO_SCENE_SELECTED', payload: { sceneIndex: index, sceneCount: keys.length, sceneTitle: d.title, filePath: d.filePath, lineNumber: 1 } }, '*');
}

function fmt(ms: number) { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; }

function PlaybackStatus({ sceneKeys, activeIndex, activeDuration, activeStartTime, totalDuration, tick, paused, onJumpTo }: {
  sceneKeys: string[]; activeIndex: number; activeDuration: number; activeStartTime: number; totalDuration: number; tick: number; paused: boolean; onJumpTo: (i: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const base = useRef(0);
  useEffect(() => { setElapsed(0); base.current = 0; }, [tick]);
  useEffect(() => {
    if (paused) return;
    const start = performance.now();
    const id = window.setInterval(() => setElapsed(base.current + (performance.now() - start)), 60);
    return () => { window.clearInterval(id); base.current += performance.now() - start; };
  }, [tick, paused]);
  const progress = activeDuration > 0 ? Math.min(1, elapsed / activeDuration) : 0;
  const total = Math.min(totalDuration, activeStartTime + Math.min(elapsed, activeDuration));
  return (
    <>
      <div className="flex-1 flex items-center gap-1.5">
        {sceneKeys.map((k, i) => (
          <button key={k} onClick={() => onJumpTo(i)} aria-label={`Jump to scene ${i + 1}`} aria-current={i === activeIndex ? 'true' : undefined}
            className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:h-4 hover:bg-white/25 transition-all relative min-h-[12px]">
            <div className="absolute inset-y-0 left-0 bg-white/90 rounded-full transition-[width] duration-100" style={{ width: `${i === activeIndex ? progress * 100 : 0}%` }} />
          </button>
        ))}
      </div>
      <div className="text-xl text-white/60 font-mono tabular-nums shrink-0">{activeIndex + 1}/{sceneKeys.length}</div>
      <div className="min-w-[11ch] text-right text-xl text-white/80 font-mono tabular-nums shrink-0" role="timer">{fmt(total)} / {fmt(totalDuration)}</div>
    </>
  );
}

const btn = 'w-14 h-14 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors rounded-lg shrink-0';

export const CHAPTERS: Record<string, string[]> = {
  dashboard: ['dashboard'], course: ['course'], today: ['today'], foundation: ['foundation'], book: ['book'],
  computerized: ['computerized'], mock: ['mock', 'instructions', 'runner', 'passage'], instructions: ['instructions'],
  runner: ['runner'], passage: ['passage'], custom: ['custom'], results: ['results'], account: ['account'], support: ['support'],
};

type TplProps = { durations: Record<string, number>; loop?: boolean; paused?: boolean; muted?: boolean; onSceneChange?: (k: string) => void };
const ROLE_TEMPLATES = Object.fromEntries((Object.keys(ROLE_FILMS) as Role[]).map((r) => [r, (p: TplProps) => <RoleFilmTemplate role={r} {...p} />])) as Record<Role, (p: TplProps) => React.ReactElement>;

/** Reads ?film=guide(default)|admin|institution|teacher|marketing | ?chapter=KEY | ?muted=1. */
export function readPlayerConfig() {
  const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const muted = q.get('muted') === '1';
  if (q.get('film') === 'marketing') return { Template: MarketingTemplate, base: MARKETING_DURATIONS as Record<string, number>, muted };
  const film = q.get('film') ?? '';
  if (Object.prototype.hasOwnProperty.call(ROLE_FILMS, film)) return { Template: ROLE_TEMPLATES[film as Role], base: roleDurations(film as Role), muted };
  const ch = q.get('chapter') ?? '';
  if (Object.prototype.hasOwnProperty.call(EXTRA_DURATIONS, ch)) return { Template: ExtraChapterTemplate, base: { [ch]: EXTRA_DURATIONS[ch as keyof typeof EXTRA_DURATIONS] } as Record<string, number>, muted };
  const keys = CHAPTERS[ch];
  if (keys) {
    const base: Record<string, number> = {};
    for (const k of keys) base[k] = SCENE_DURATIONS[k as keyof typeof SCENE_DURATIONS];
    return { Template: VideoTemplate, base, muted };
  }
  return { Template: VideoTemplate, base: GUIDE_DURATIONS, muted };
}
const CONFIG = readPlayerConfig();
/** A single-scene segment is played as k_r1/k_r2 so the player remounts (and audio re-seeks) on every loop. */
function loopable(d: Record<string, number>) {
  const ks = Object.keys(d);
  return ks.length === 1 && !/_r[12]$/.test(ks[0]) ? { [`${ks[0]}_r1`]: d[ks[0]], [`${ks[0]}_r2`]: d[ks[0]] } : d;
}

export default function VideoWithControls() {
  return <ViewerProvider><Player /></ViewerProvider>;
}

function Player() {
  const isIframed = typeof window !== 'undefined' && window.self !== window.top;
  const { Template, base } = CONFIG;
  const c = useSceneControls(base);
  const [muted, setMuted] = useState(CONFIG.muted);
  const { jumpTo, sceneKeys, paused } = c;
  const handleJumpTo = useCallback((i: number) => { jumpTo(i); announce(i, sceneKeys); }, [jumpTo, sceneKeys]);

  useEffect(() => {
    if (!paused) return;
    const frozen = document.getAnimations().filter((a) => a.playState === 'running');
    frozen.forEach((a) => a.pause());
    return () => frozen.forEach((a) => a.play());
  }, [paused]);

  const sensorRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [tapPinned, setTapPinned] = useState(false);
  useEffect(() => {
    if (!(collapsed && tapPinned)) return;
    const h = (e: PointerEvent) => { if (e.pointerType === 'mouse') return; if (sensorRef.current && !sensorRef.current.contains(e.target as Node)) setTapPinned(false); };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [collapsed, tapPinned]);

  if (!isIframed) return <Template durations={loopable(base)} muted={CONFIG.muted} />;
  const visible = !collapsed || hovering || tapPinned;

  return (
    <div className="relative w-full h-screen">
      <Template key={c.mountKey} durations={loopable(c.durations)} loop paused={c.paused} muted={muted} onSceneChange={c.onSceneChange} />
      <div ref={sensorRef} className="absolute bottom-0 left-0 right-0 z-50 flex flex-col justify-end" style={{ height: '25%' }}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovering(true); }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHovering(false); }}
        onPointerDown={(e) => { if (e.pointerType !== 'mouse' && collapsed) setTapPinned(true); }}>
        <div className="flex-1 w-full" aria-hidden="true" />
        <div dir="ltr" className={`flex items-center gap-3 bg-black/50 backdrop-blur-sm px-5 py-4 transition-all duration-200 ease-out ${visible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}`}>
          <button onClick={c.togglePause} className={btn} aria-label={c.paused ? 'Play' : 'Pause'}>{c.paused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}</button>
          <button onClick={c.toggleLock} aria-pressed={c.locked} aria-label="Loop current scene" className={`${btn} ${c.locked ? 'text-white bg-white/15' : ''}`}><Repeat className="w-8 h-8" /></button>
          <button onClick={() => setMuted((m) => !m)} className={btn} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}</button>
          <div className="w-px self-stretch bg-white/15" aria-hidden="true" />
          <PlaybackStatus sceneKeys={c.sceneKeys} activeIndex={c.activeIndex} activeDuration={c.activeDuration} activeStartTime={c.activeStartTime} totalDuration={c.totalDuration} tick={c.tick} paused={c.paused} onJumpTo={handleJumpTo} />
          <button className={btn} aria-label={collapsed ? 'Show controls' : 'Hide controls'}
            onClick={() => setCollapsed((v) => { if (!v) { setHovering(false); setTapPinned(false); } return !v; })}>
            {collapsed ? <ChevronUp className="w-10 h-10" /> : <ChevronDown className="w-10 h-10" />}
          </button>
        </div>
      </div>
    </div>
  );
}
