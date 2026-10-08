import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Play } from "lucide-react";
import type {
  QudratVerbalVideoProgress,
  QudratVerbalVideoProgressInput,
} from "@workspace/api-client-react";

type VerbalVideoProgressCardProps = {
  videoId: string;
  lesson: number;
  duration: string;
  categoryLabel: string;
  videoUrl: string;
  quizUrl: string;
  quizLabel: string;
  testIdPrefix: string;
  progress?: QudratVerbalVideoProgress;
  progressLoaded: boolean;
  onProgressEvent: (
    videoId: string,
    input: QudratVerbalVideoProgressInput,
  ) => Promise<QudratVerbalVideoProgress>;
};

function formatVideoPosition(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0
    ? `${hours}:${String(remainingMinutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function VerbalVideoProgressCard({
  videoId,
  lesson,
  duration,
  categoryLabel,
  videoUrl,
  quizUrl,
  quizLabel,
  testIdPrefix,
  progress,
  progressLoaded,
  onProgressEvent,
}: VerbalVideoProgressCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeAppliedRef = useRef(false);
  const restoringResumeRef = useRef(false);
  const startedRef = useRef(false);
  const lastTickAtRef = useRef(0);
  const [saveError, setSaveError] = useState(false);

  const applySavedPosition = useCallback(() => {
    const video = videoRef.current;
    if (
      !progressLoaded ||
      resumeAppliedRef.current ||
      startedRef.current ||
      !video ||
      video.readyState < 1
    ) {
      return;
    }
    resumeAppliedRef.current = true;
    const resumePosition = progress?.resumePositionSeconds || 0;
    if (
      progress?.state !== "COMPLETED" &&
      resumePosition > 1 &&
      resumePosition < video.duration - 1
    ) {
      restoringResumeRef.current = true;
      video.currentTime = resumePosition;
    }
  }, [progress?.resumePositionSeconds, progress?.state, progressLoaded]);

  useEffect(() => {
    applySavedPosition();
  }, [applySavedPosition]);

  const sendProgressEvent = useCallback(
    (event: QudratVerbalVideoProgressInput["event"]) => {
      const video = videoRef.current;
      if (!video) return;
      const now = Date.now();
      if (event === "tick") {
        if (now - lastTickAtRef.current < 10_000) return;
        lastTickAtRef.current = now;
      }
      void onProgressEvent(videoId, {
        event,
        positionSeconds: Math.min(video.duration || 4000, Math.max(0, video.currentTime)),
      })
        .then(() => setSaveError(false))
        .catch(() => setSaveError(true));
    },
    [onProgressEvent, videoId],
  );

  const progressPercent = progress?.progressPercent || 0;
  const isCompleted = progress?.state === "COMPLETED";

  return (
    <article
      className="overflow-hidden rounded-2xl border border-[#DDE6E2] bg-white"
      data-testid={`${testIdPrefix}-video-${lesson}`}
    >
      <div className="aspect-video bg-[#07111f]">
        <video
          ref={videoRef}
          src={videoUrl}
          title={`${categoryLabel} — الدرس ${lesson}`}
          className="h-full w-full"
          controls
          playsInline
          preload="none"
          controlsList="nodownload"
          onLoadedMetadata={applySavedPosition}
          onPlay={() => {
            startedRef.current = true;
            lastTickAtRef.current = Date.now();
            sendProgressEvent("play");
          }}
          onTimeUpdate={() => {
            if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
              sendProgressEvent("tick");
            }
          }}
          onSeeked={() => {
            if (restoringResumeRef.current) {
              restoringResumeRef.current = false;
              return;
            }
            sendProgressEvent("seek");
          }}
          onPause={() => {
            if (startedRef.current) sendProgressEvent("pause");
          }}
          onEnded={() => sendProgressEvent("ended")}
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF8F3] text-[#147D68]">
              <Play className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h5 className="truncate text-sm font-black text-[#0D1B2A]">
                {categoryLabel} — الدرس {lesson}
              </h5>
              <p className="mt-1 text-xs font-bold text-[#64748B]">ملخص الـ95 · {categoryLabel}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-black text-[#475569]">
            {duration}
          </span>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-bold">
            <span className={isCompleted ? "text-[#147D68]" : "text-[#64748B]"}>
              {isCompleted
                ? "مكتمل مشاهدة"
                : progressPercent > 0
                  ? `تمت مشاهدة ${progressPercent}%`
                  : "لم تبدأ المشاهدة"}
            </span>
            {progress?.resumePositionSeconds ? (
              <span className="text-[#64748B]">
                آخر موضع {formatVideoPosition(progress.resumePositionSeconds)}
              </span>
            ) : null}
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]"
            role="progressbar"
            aria-label={`تقدم مشاهدة ${categoryLabel} الدرس ${lesson}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <div
              className={`h-full rounded-full transition-[width] ${isCompleted ? "bg-[#147D68]" : "bg-[#3B67A5]"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {saveError ? (
            <p className="mt-1.5 text-[11px] font-bold text-[#A64242]" role="status">
              تعذر حفظ التقدم الآن؛ سيُحاول النظام الحفظ مع استمرار المشاهدة.
            </p>
          ) : null}
        </div>

        <Link
          href={quizUrl}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] px-3 py-2.5 text-xs font-black text-white hover:bg-[#18334D]"
          data-testid={`${testIdPrefix}-quiz-${lesson}`}
        >
          <CheckCircle2 className="h-4 w-4" />
          {quizLabel}
        </Link>
      </div>
    </article>
  );
}
