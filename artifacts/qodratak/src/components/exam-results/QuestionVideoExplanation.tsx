import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { QuestionVideoClipOutput } from '@workspace/api-client-react';
import { PlayCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { resolveFoundationVideoUrl } from '@/lib/foundationVideoUrl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const time = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;

export default function QuestionVideoExplanation({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);
  const playerRef = useRef<HTMLVideoElement>(null);
  const query = useQuery<QuestionVideoClipOutput>({
    queryKey: ['/api/student/question-video', questionId],
    enabled: open && !!questionId,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/student/question-video/${encodeURIComponent(questionId)}`);
      return response.json();
    },
    staleTime: 60_000,
  });
  const clip = query.data;
  const start = clip?.startSeconds ?? 0, end = clip?.endSeconds ?? 0;
  const available = clip?.available && !!clip.videoUrl && start >= 0 && end > start
    && Number.isFinite(clip.startSeconds) && Number.isFinite(clip.endSeconds);
  return <Dialog open={open} onOpenChange={setOpen}>
    <Button type="button" variant="outline" className="border-primary/30 text-primary"
      data-testid={`question-video-${questionId}`} onClick={() => { setPlaybackError(false); setOpen(true); }}>
      <PlayCircle className="ml-2 h-4 w-4" /> شرح السؤال من الفيديو
    </Button>
    <DialogContent dir="rtl" className="max-w-3xl max-h-[90dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>شرح السؤال من فيديو البنك</DialogTitle>
        <DialogDescription>يبدأ التشغيل عند شرح هذا السؤال ويتوقف عند نهاية المقطع.</DialogDescription>
      </DialogHeader>
      {query.isLoading && <p role="status">جارٍ تحميل توقيت الشرح…</p>}
      {query.isError && <div role="alert" className="space-y-3">
        <p>{query.error instanceof Error && query.error.message.includes('403')
          ? 'شروح الفيديو متاحة للاشتراك النشط وخلال التجربة المجانية.'
          : 'تعذر تحميل شرح الفيديو.'}</p><Button onClick={() => void query.refetch()}>حاول مجددًا</Button>
      </div>}
      {available && <div className="space-y-3">
        <p className="font-bold">البنك {clip.bankNumber} · السؤال {clip.questionNumber}</p>
        <p className="text-sm text-muted-foreground" dir="ltr">{time(start)} — {time(end)}</p>
        {clip.approximate && <p role="status" className="text-sm text-amber-700 dark:text-amber-300">
          التوقيت تقريبي ولم يعتمد بمراجعة بصرية؛ قد يبدأ الشرح قبله أو بعده.
        </p>}
        {!clip.approximate && !clip.verified && <p className="text-xs text-muted-foreground">
          التوقيت مرصود من رقم السؤال الظاهر في الفيديو، بدقة أخذ العينات، وليس بتقسيم مدة الفيديو بالتساوي.
        </p>}
        <video ref={playerRef} key={`${questionId}-${start}-${end}`}
          src={`${resolveFoundationVideoUrl(clip.videoUrl!)}#t=${start},${end}`}
          title={`شرح السؤال ${clip.questionNumber} من البنك ${clip.bankNumber}`}
          className="aspect-video w-full rounded-xl bg-black" controls playsInline preload="metadata"
          controlsList="nodownload"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            if (!Number.isFinite(video.duration) || start >= video.duration || end > video.duration + 1) {
              video.pause(); setPlaybackError(true); return;
            }
            video.currentTime = start;
          }}
          onPlay={(event) => {
            if (playbackError) { event.currentTarget.pause(); return; }
            if (event.currentTarget.currentTime >= end) event.currentTarget.currentTime = start;
          }}
          onSeeking={(event) => {
            const video = event.currentTarget;
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
      {clip && !available && <div className="space-y-3">
        <p>لم يتوفر مقطع مضبوط لهذا السؤال بعد. لن نختار دقيقة عشوائية من الفيديو.</p>
        {clip.videoUrl && <a href={resolveFoundationVideoUrl(clip.videoUrl)} target="_blank" rel="noreferrer"
          className="text-primary underline">شاهد فيديو البنك كاملًا</a>}
      </div>}
    </DialogContent>
  </Dialog>;
}
