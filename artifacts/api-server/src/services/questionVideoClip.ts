export type VideoTimingSource = {
  questionId?: string;
  videoTimestampSeconds?: number;
  videoEndTimestampSeconds?: number;
  videoTimestampInferred?: boolean;
  videoEndTimestampInferred?: boolean;
  videoTimingVerified?: boolean;
  videoTimingMethod?: string;
};

/** Assigns a two-minute clip around each question's center in an equal 48-part split. */
export function equalPartitionClipBounds(
  durationSeconds: number,
  questionNumber: number,
  questionCount = 48,
  clipWindowSeconds = 120,
) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 ||
      !Number.isInteger(questionNumber) || questionNumber < 1 ||
      !Number.isInteger(questionCount) || questionCount < 1 || questionNumber > questionCount ||
      !Number.isFinite(clipWindowSeconds) || clipWindowSeconds <= 0) {
    throw new RangeError("Invalid video duration, question position, or clip window.");
  }
  const intervalSeconds = durationSeconds / questionCount;
  const centerSeconds = (questionNumber - 0.5) * intervalSeconds;
  const durationMs = Math.round(durationSeconds * 1000);
  const windowMs = Math.round(clipWindowSeconds * 1000);
  let startMs = Math.max(0, Math.round((centerSeconds - clipWindowSeconds / 2) * 1000));
  const endMs = Math.min(
    durationMs,
    Math.round((centerSeconds + clipWindowSeconds / 2) * 1000),
  );
  if (endMs - startMs > windowMs) startMs = endMs - windowMs;
  return {
    startSeconds: startMs / 1000,
    endSeconds: endMs / 1000,
  };
}

export function computerBankQuestionIdentity(id?: string) {
  const match = /^quantitative-computer-bank-(\d+)-(\d+)$/.exec(id || '');
  if (!match) return null;
  const bankNumber = Number(match[1]), questionNumber = Number(match[2]);
  return bankNumber >= 1 && bankNumber <= 70 && questionNumber >= 1 && questionNumber <= 48
    ? { bankNumber, questionNumber } : null;
}

/** Stored bounds are used as-is; missing timing falls back to the full bank video. */
export function buildQuestionVideoClip(source: VideoTimingSource, videoUrl: string) {
  const identity = computerBankQuestionIdentity(source.questionId);
  if (!identity) return { available: false, reason: 'unmapped_question' };
  const expectedFile = `/computer-bank-${String(identity.bankNumber).padStart(2, '0')}.mp4`;
  const safeScheme = videoUrl.startsWith('/foundation/quantitative/') ||
    videoUrl.startsWith('/api/learning/computerized/quantitative/computer-bank-') ||
    /^https?:\/\//i.test(videoUrl);
  if (!safeScheme || !videoUrl.split(/[?#]/, 1)[0].endsWith(expectedFile))
    return { available: false, reason: 'video_unavailable', ...identity };
  const start = source.videoTimestampSeconds, end = source.videoEndTimestampSeconds;
  if (typeof start !== 'number' || typeof end !== 'number' ||
      !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
    return { available: false, reason: 'timing_unavailable', videoUrl, ...identity };
  }
  const approximate = source.videoTimestampInferred === true || source.videoEndTimestampInferred === true;
  return { available: true, videoUrl, startSeconds: start, endSeconds: end,
    approximate, verified: source.videoTimingVerified === true && !approximate, ...identity };
}
