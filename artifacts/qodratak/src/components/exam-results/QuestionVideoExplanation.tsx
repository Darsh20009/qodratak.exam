import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { QuestionVideoClipOutput } from '@workspace/api-client-react';
import { PlayCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { resolveFoundationVideoUrl } from '@/lib/foundationVideoUrl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const time = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
type TimingAwareClip = QuestionVideoClipOutput & {
  timingMode?: 'equal_partition_48';
  questionCount?: number;
  clipWindowSeconds?: number;
};

export default function QuestionVideoExplanation({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);
  const [runtimeBounds, setRuntimeBounds] = useState<{ key: string; start: number; end: number } | null>(null);
  const playerRef = useRef<HTMLVideoElement>(null);
  const query = useQuery<TimingAwareClip>({
    queryKey: ['/api/student/question-video', questionId],
    enabled: open && !!questionId,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/student/question-video/${encodeURIComponent(questionId)}`);
      return response.json();
    },
    staleTime: 60_000,
  });
  const clip = query.data;
  const boundsKey = `${questionId}:${clip?.videoUrl || ''}`;
  const calculatedBounds = runtimeBounds?.key === boundsKey ? runtimeBounds : null;
  const start = clip?.startSeconds ?? calculatedBounds?.start ?? 0;
  const end = clip?.endSeconds ?? calculatedBounds?.end ?? 0;
  const dynamicTiming = clip?.timingMode === 'equal_partition_48';
  const available = !!clip?.videoUrl && (
    (clip.available && start >= 0 && end > start &&
      Number.isFinite(start) && Number.isFinite(end)) ||
    (dynamicTiming && !!calculatedBounds)
  );
  const showPlayer = !!clip?.videoUrl && (available || dynamicTiming);
  const getRuntimeBounds = (duration: number) => {
    if (!clip || !Number.isFinite(duration) || duration <= 0) return null;
    const questionCount = clip.questionCount ?? 48;
    const questionNumber = clip.questionNumber;
    const windowSeconds = clip.clipWindowSeconds ?? 120;
    if (typeof questionNumber !== 'number' || !Number.isInteger(questionNumber) || questionNumber < 1 ||
        questionNumber > questionCount || !Number.isFinite(windowSeconds) || windowSeconds <= 0) return null;
    const center = ((questionNumber - 0.5) * duration) / questionCount;
    const endSeconds = Math.min(duration, center + windowSeconds / 2);
    const startSeconds = Math.max(0, Math.min(center - windowSeconds / 2, endSeconds - windowSeconds));
    return { start: startSeconds, end: endSeconds };
  };
  return <Dialog open={open} onOpenChange={setOpen}>
    <Button type="button" variant="outline" className="border-primary/30 text-primary"
      data-testid={`question-video-${questionId}`} onClick={() => { setPlaybackError(false); setOpen(true); }}>
      <PlayCircle className="ml-2 h-4 w-4" /> شرح السؤال من الفيديو
    </Button>
    <DialogContent dir="rtl" className="max-w-3xl max-h-[90dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>شرح السؤال من فيديو البنك</DialogTitle>
        <DialogDescription>يعرض المشغل موضع السؤال في فيديو البنك، ويوضح إذا كان التوقيت تقديريًا.</DialogDescription>
      </DialogHeader>
      {query.isLoading && <p role="status">جارٍ تحميل توقيت الشرح…</p>}
      {query.isError && <div role="alert" className="space-y-3">
        <p>{query.error instanceof Error && query.error.message.includes('403')
          ? 'شروح الفيديو متاحة للاشتراك النشط وخلال التجربة المجانية.'
          : 'تعذر تحميل شرح الفيديو.'}</p><Button onClick={() => void query.refetch()}>حاول مجددًا</Button>
      </div>}
      {showPlayer && <div className="space-y-3">
        <p className="font-bold">البنك {clip.bankNumber} · السؤال {clip.questionNumber}</p>
        {available && <p className="text-sm text-muted-foreground" dir="ltr">{time(start)} — {time(end)}</p>}
        {dynamicTiming && !calculatedBounds && <p role="status" className="text-sm text-muted-foreground">
          جارٍ قراءة مدة الفيديو لتحديد مقطع السؤال من تقسيم البنك إلى ٤٨ جزءًا…
        </p>}
        {clip.approximate && <p role="status" className="text-sm text-amber-700 dark:text-amber-300">
          {typeof clip.bankNumber === 'number' && clip.bankNumber >= 51 && clip.bankNumber <= 70
            ? 'التوقيت تقديري: قُسمت مدة الفيديو على ٤٨، وتغطي اللقطة دقيقتين حول موضع السؤال المتوقع؛ قد لا يبدأ الشرح الفعلي عند هذا الموضع.'
            : 'التوقيت تقريبي ولم يعتمد بمراجعة بصرية؛ قد يبدأ الشرح قبله أو بعده.'}
        </p>}
        {!clip.approximate && !clip.verified && <p className="text-xs text-muted-foreground">
          التوقيت مرصود من رقم السؤال الظاهر في الفيديو، بدقة أخذ العينات، وليس بتقسيم مدة الفيديو بالتساوي.
        </p>}
        <video ref={playerRef} key={`${questionId}-${clip.videoUrl}`}
          src={dynamicTiming
            ? resolveFoundationVideoUrl(clip.videoUrl!)
            : `${resolveFoundationVideoUrl(clip.videoUrl!)}#t=${start},${end}`}
          title={`شرح السؤال ${clip.questionNumber} من البنك ${clip.bankNumber}`}
          className="aspect-video w-full rounded-xl bg-black" controls playsInline preload="metadata"
          controlsList="nodownload"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
             if (dynamicTiming && !calculatedBounds) {
               const bounds = getRuntimeBounds(video.duration);
               if (!bounds || bounds.start >= video.duration || bounds.end > video.duration + 1) {
                 video.pause(); setPlaybackError(true); return;
               }
               setRuntimeBounds({ key: boundsKey, ...bounds });
               video.currentTime = bounds.start;
               return;
             }
            if (!Number.isFinite(video.duration) || start >= video.duration || end > video.duration + 1) {
              video.pause(); setPlaybackError(true); return;
            }
            video.currentTime = start;
          }}
          onPlay={(event) => {
            if (playbackError) { event.currentTarget.pause(); return; }
             if (dynamicTiming && !calculatedBounds) { event.currentTarget.pause(); return; }
            if (event.currentTarget.currentTime >= end) event.currentTarget.currentTime = start;
          }}
          onSeeking={(event) => {
            const video = event.currentTarget;
             if (!available) { video.pause(); return; }
            if (video.currentTime < start || video.currentTime > end)
              video.currentTime = Math.max(start, Math.min(end, video.currentTime));
          }}
          onTimeUpdate={(event) => {
            if (event.currentTarget.currentTime >= end) event.currentTarget.pause();
          }}
          onError={() => setPlaybackError(true)} />
        {playbackError && <p role="alert" className="text-sm text-destructive">
          تعذر تشغيل المقطع أو أن توقيته لا يتوافق مع الفيديو. لم نفتح شرح سؤال آخر.
        </p>}
        <Button variant="outline" onClick={() => {
          const video = playerRef.current;
          if (video && !playbackError) { video.currentTime = start; void video.play().catch(() => setPlaybackError(true)); }
        }}>أعد مشاهدة الشرح</Button>
      </div>}
      {clip && !available && !dynamicTiming && <div className="space-y-3">
        <p>لا يتوفر توقيت دقيق لهذا السؤال بعد؛ يمكنك مشاهدة فيديو البنك كاملًا بدل عرض مقطع قد يشرح سؤالًا آخر.</p>
        {clip.videoUrl && <>
          <video key={`${questionId}-full-bank`}
            src={resolveFoundationVideoUrl(clip.videoUrl)}
            title={`فيديو البنك الكامل ${clip.bankNumber}`}
            className="aspect-video w-full rounded-xl bg-black"
            controls playsInline preload="metadata"
            onError={() => setPlaybackError(true)} />
          {playbackError && <p role="alert" className="text-sm text-destructive">
            تعذر تشغيل الفيديو على هذا الجهاز أو الاتصال.
          </p>}
          <a href={resolveFoundationVideoUrl(clip.videoUrl)} target="_blank" rel="noreferrer"
            className="text-primary underline">افتح فيديو البنك كاملًا في صفحة مستقلة</a>
        </>}
      </div>}
    </DialogContent>
  </Dialog>;
}
