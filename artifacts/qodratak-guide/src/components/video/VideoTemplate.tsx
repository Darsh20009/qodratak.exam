/// <reference lib="dom" />
import { useEffect, useRef } from 'react';
import { VideoCanvas, type VideoAspectRatio, useVideoPlayer, VideoPausedContext } from '@/lib/video';
import { AnimatePresence } from 'framer-motion';
import { IntroScene, OutroScene, StepScene, STEPS, BrowserStage, Grain } from './Scenes';

export const SCENE_DURATIONS = {
  intro: 4500,
  dashboard: 4500,
  course: 4000,
  today: 4000,
  foundation: 4000,
  book: 4000,
  computerized: 4500,
  mock: 5000,
  instructions: 5000,
  runner: 6000,
  passage: 4500,
  custom: 4000,
  results: 4500,
  account: 4000,
  support: 4000,
  outro: 5500,
};

const VIDEO_ASPECT_RATIO: VideoAspectRatio = '16:9';

const mk = (i: number) => () => <StepScene step={STEPS[i]} index={i} />;
const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: IntroScene,
  dashboard: mk(0),
  course: mk(1),
  today: mk(2),
  foundation: mk(3),
  book: mk(4),
  computerized: mk(5),
  mock: mk(6),
  instructions: mk(7),
  runner: mk(8),
  passage: mk(9),
  custom: mk(10),
  results: mk(11),
  account: mk(12),
  support: mk(13),
  outro: OutroScene,
};

const STAGE_INDEX: Record<string, number> = Object.fromEntries(Object.keys(SCENE_DURATIONS).map((k, i) => [k, i - 1]));

// bg_music_full.mp3: premix of the original 46 s bed with itself (6 s triangular crossfade at ~40 s), trimmed to 73 s with a 3 s tail fade. Seeks use absolute film offsets.
const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let c = 0;
  for (const [k, ms] of Object.entries(SCENE_DURATIONS)) { out[k] = c / 1000; c += ms; }
  return out;
})();

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  paused = false,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  paused?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey, onSceneChange]);
  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.5;
    if (paused) { a.pause(); return; }
    if (lastKey.current !== currentSceneKey) {
      lastKey.current = currentSceneKey;
      const t = SCENE_START_SEC[baseSceneKey] ?? 0;
      if (Math.abs(a.currentTime - t) > 0.18) a.currentTime = t;
    }
    a.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted, paused]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas aspectRatio={VIDEO_ASPECT_RATIO} style={{ backgroundColor: '#0D1B2A' }}>
        <Grain />
        <BrowserStage index={STAGE_INDEX[baseSceneKey] ?? -1} />
        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
        <audio ref={audioRef} src={`${import.meta.env.BASE_URL}audio/bg_music_full.mp3`} preload="auto" autoPlay muted={muted} />
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}
