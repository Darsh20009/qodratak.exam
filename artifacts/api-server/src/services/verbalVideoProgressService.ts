import type {
  QudratVerbalVideoProgress,
  QudratVerbalVideoProgressInput,
  QudratVerbalVideoProgressSummary,
} from '@workspace/api-zod';
import {
  getQudratVerbalComputerizedVideo,
  QUDRAT_VERBAL_COMPUTERIZED_VIDEOS,
} from './qudratVerbalBookFilesService';
import {
  VerbalVideoProgressModel,
  type IVerbalVideoProgress,
  type VerbalVideoWatchRange,
} from '../mongodb/verbalVideoProgressModel';

const COMPLETION_THRESHOLD = 0.9;
const MAX_CREDITABLE_GAP_MS = 30_000;
const MAX_PLAYBACK_SPEED = 2;
const SEEK_TOLERANCE_SECONDS = 2;

export class VerbalVideoProgressError extends Error {
  constructor(
    message: string,
    public readonly code: 'STUDENT_REQUIRED' | 'VIDEO_NOT_FOUND' | 'INVALID_POSITION',
  ) {
    super(message);
    this.name = 'VerbalVideoProgressError';
  }
}

export function mergeVerbalVideoWatchRange(
  ranges: readonly VerbalVideoWatchRange[],
  startSeconds: number,
  endSeconds: number,
): VerbalVideoWatchRange[] {
  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds) || endSeconds <= startSeconds) {
    return ranges.map((range) => ({ ...range }));
  }

  const sorted = [...ranges, { startSeconds, endSeconds }]
    .filter((range) =>
      Number.isFinite(range.startSeconds) &&
      Number.isFinite(range.endSeconds) &&
      range.startSeconds >= 0 &&
      range.endSeconds > range.startSeconds,
    )
    .sort((left, right) => left.startSeconds - right.startSeconds);

  const merged: VerbalVideoWatchRange[] = [];
  for (const range of sorted) {
    const previous = merged.at(-1);
    if (!previous || range.startSeconds > previous.endSeconds + 0.75) {
      merged.push({ ...range });
      continue;
    }
    previous.endSeconds = Math.max(previous.endSeconds, range.endSeconds);
  }
  return merged;
}

export function getCreditedVerbalWatchRange(
  previousPositionSeconds: number,
  currentPositionSeconds: number,
  elapsedMs: number,
  wasPlaying: boolean,
): VerbalVideoWatchRange | undefined {
  if (!wasPlaying || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return undefined;
  const elapsedSeconds = Math.min(MAX_CREDITABLE_GAP_MS, elapsedMs) / 1000;
  const positionDelta = currentPositionSeconds - previousPositionSeconds;
  if (positionDelta <= 0) return undefined;
  if (positionDelta > elapsedSeconds * MAX_PLAYBACK_SPEED + SEEK_TOLERANCE_SECONDS) {
    return undefined;
  }
  return {
    startSeconds: previousPositionSeconds,
    endSeconds: currentPositionSeconds,
  };
}

export function calculateVerbalVideoWatchedSeconds(
  ranges: readonly VerbalVideoWatchRange[],
  durationSeconds: number,
): number {
  return Math.min(
    durationSeconds,
    ranges.reduce(
      (total, range) => total + Math.max(0, range.endSeconds - range.startSeconds),
      0,
    ),
  );
}

function assertStudent(studentId: string): void {
  if (!studentId.trim()) {
    throw new VerbalVideoProgressError('يلزم تسجيل الدخول كطالب', 'STUDENT_REQUIRED');
  }
}

function publicProgress(
  videoId: string,
  durationSeconds: number,
  progress?: Pick<IVerbalVideoProgress, 'watchedRanges' | 'resumePositionSeconds' | 'state' | 'completedAt'>,
): QudratVerbalVideoProgress {
  const watchedSeconds = calculateVerbalVideoWatchedSeconds(
    progress?.watchedRanges || [],
    durationSeconds,
  );
  return {
    videoId,
    durationSeconds,
    watchedSeconds,
    progressPercent: Math.min(100, Math.floor((watchedSeconds / durationSeconds) * 100)),
    resumePositionSeconds: Math.min(
      durationSeconds,
      Math.max(0, progress?.resumePositionSeconds || 0),
    ),
    state: progress?.state || 'NOT_STARTED',
    completedAt: progress?.completedAt || null,
  };
}

export async function getQudratVerbalVideoProgressSummary(
  studentId: string,
): Promise<QudratVerbalVideoProgressSummary> {
  assertStudent(studentId);
  const videoIds = QUDRAT_VERBAL_COMPUTERIZED_VIDEOS.map((video) => video.id);
  const rows = await VerbalVideoProgressModel.find({
    studentId,
    videoId: { $in: videoIds },
  })
    .select('videoId durationSeconds watchedRanges resumePositionSeconds state completedAt')
    .lean();
  const byVideoId = new Map(rows.map((row) => [row.videoId, row]));

  return {
    items: QUDRAT_VERBAL_COMPUTERIZED_VIDEOS.map((video) =>
      publicProgress(video.id, video.durationSeconds, byVideoId.get(video.id)),
    ),
  };
}

export async function recordQudratVerbalVideoProgress(
  studentId: string,
  videoId: string,
  input: QudratVerbalVideoProgressInput,
  now = new Date(),
): Promise<QudratVerbalVideoProgress> {
  assertStudent(studentId);
  const video = getQudratVerbalComputerizedVideo(videoId);
  if (!video) {
    throw new VerbalVideoProgressError('الفيديو غير موجود في قائمة دروس اللفظي', 'VIDEO_NOT_FOUND');
  }
  if (
    !Number.isFinite(input.positionSeconds) ||
    input.positionSeconds < 0 ||
    input.positionSeconds > video.durationSeconds
  ) {
    throw new VerbalVideoProgressError('موضع الفيديو غير صالح', 'INVALID_POSITION');
  }

  let progress = await VerbalVideoProgressModel.findOne({ studentId, videoId });
  if (!progress && (input.event === 'seek' || input.event === 'pause' || input.event === 'ended')) {
    return publicProgress(videoId, video.durationSeconds);
  }
  if (!progress) {
    try {
      progress = await VerbalVideoProgressModel.create({
        studentId,
        videoId,
        durationSeconds: video.durationSeconds,
        watchedRanges: [],
        resumePositionSeconds: input.positionSeconds,
        lastPositionSeconds: input.positionSeconds,
        lastHeartbeatAt: now,
        wasPlaying: false,
        state: 'NOT_STARTED',
      });
    } catch (error) {
      if ((error as { code?: number })?.code !== 11000) throw error;
      progress = await VerbalVideoProgressModel.findOne({ studentId, videoId });
      if (!progress) throw error;
    }
  }

  const currentPositionSeconds = Math.min(input.positionSeconds, video.durationSeconds);
  const previousPositionSeconds = progress.lastPositionSeconds;
  const elapsedMs = progress.lastHeartbeatAt
    ? Math.max(0, now.getTime() - progress.lastHeartbeatAt.getTime())
    : 0;
  const shouldMeasurePlayback = input.event === 'tick' || input.event === 'pause' || input.event === 'ended';
  const creditedRange = shouldMeasurePlayback
    ? getCreditedVerbalWatchRange(
        previousPositionSeconds,
        currentPositionSeconds,
        elapsedMs,
        progress.wasPlaying,
      )
    : undefined;

  if (creditedRange) {
    progress.watchedRanges = mergeVerbalVideoWatchRange(
      progress.watchedRanges,
      creditedRange.startSeconds,
      creditedRange.endSeconds,
    );
  }

  progress.durationSeconds = video.durationSeconds;
  progress.resumePositionSeconds = currentPositionSeconds;
  progress.lastPositionSeconds = currentPositionSeconds;
  progress.lastHeartbeatAt = now;
  progress.wasPlaying = input.event === 'play' || input.event === 'tick' || input.event === 'seek';

  const watchedSeconds = calculateVerbalVideoWatchedSeconds(
    progress.watchedRanges,
    video.durationSeconds,
  );
  if (progress.state !== 'COMPLETED') {
    progress.state = input.event === 'play' || watchedSeconds > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
    if (watchedSeconds / video.durationSeconds >= COMPLETION_THRESHOLD) {
      progress.state = 'COMPLETED';
      progress.completedAt = now;
    }
  }

  await progress.save();
  return publicProgress(videoId, video.durationSeconds, progress);
}
