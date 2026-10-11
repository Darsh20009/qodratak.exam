export type VideoTimingSource = {
  questionId?: string;
  videoTimestampSeconds?: number;
  videoEndTimestampSeconds?: number;
  videoTimestampInferred?: boolean;
  videoEndTimestampInferred?: boolean;
  videoTimingVerified?: boolean;
};

export function computerBankQuestionIdentity(id?: string) {
  const match = /^quantitative-computer-bank-(\d+)-(\d+)$/.exec(id || '');
  if (!match) return null;
  const bankNumber = Number(match[1]), questionNumber = Number(match[2]);
  return bankNumber >= 1 && bankNumber <= 50 && questionNumber >= 1 && questionNumber <= 48
    ? { bankNumber, questionNumber } : null;
}

/** Missing timing is not replaced with an equal-duration guess. */
export function buildQuestionVideoClip(source: VideoTimingSource, videoUrl: string) {
  const identity = computerBankQuestionIdentity(source.questionId);
  if (!identity) return { available: false, reason: 'unmapped_question' };
  const expectedFile = `/computer-bank-${String(identity.bankNumber).padStart(2, '0')}.mp4`;
  const safeScheme = videoUrl.startsWith('/foundation/quantitative/') || /^https?:\/\//i.test(videoUrl);
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
