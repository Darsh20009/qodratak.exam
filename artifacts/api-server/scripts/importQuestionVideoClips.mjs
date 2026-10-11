import fs from 'node:fs';
import mongoose from 'mongoose';

const first = JSON.parse(fs.readFileSync('generated-artifacts/quant-video-review/first-bank-timings.json'));
const late = JSON.parse(fs.readFileSync('generated-artifacts/quant-video-review/late-bank-timings.json'));
const catalog = ['computer-banks.json', 'computer-banks-11-30.json', 'computer-banks-31-50.json']
  .flatMap((file) => JSON.parse(fs.readFileSync(`.agents/outputs/quantitative-computer-banks/${file}`)).banks);
const skippedBanks = [];
const banks = catalog.filter((b) => b.questions.length).map((bank) => {
  if (bank.number <= 10 || bank.number >= 31) {
    const timing = [...first.banks, ...late.banks].find((b) => b.number === bank.number);
    if (!timing) throw new Error(`Missing detected timing for bank ${bank.number}`);
    if (bank.number === 46) {
      // Q47 remains visible at 2942s, Q48 appears at 2943s and matches
      // the original Q48 image (300 seats, 15% empty). Retain the actual
      // video end instead of extrapolating Q48 beyond the media duration.
      const last = timing.questionTimestamps.find((q) => q.questionNumber === 48);
      last.seconds = 2943;
      last.inferred = false;
    }
    if (timing.questionTimestamps.filter((q) => !q.inferred).length < 24) {
      skippedBanks.push({ bank: bank.number, reason: 'insufficient_detected_anchors' });
      return null;
    }
    return timing;
  }
  return { number: bank.number, durationSeconds: bank.video.durationSeconds,
    questionTimestamps: bank.questions.map((q) => ({
      questionNumber: q.questionNumber, seconds: q.videoTimestampSeconds,
      inferred: q.videoTimestampInferred === true,
    })) };
}).filter(Boolean);
const planned = new Map();
for (const bank of banks) {
  const timestamps = [...bank.questionTimestamps].sort((a, b) => a.questionNumber - b.questionNumber);
  if (timestamps.length !== 48 || new Set(timestamps.map((q) => q.questionNumber)).size !== 48)
    throw new Error(`Incomplete timing roster for bank ${bank.number}`);
  const invalid = timestamps.some((q, index) => {
    const next = timestamps[index + 1];
    const end = next?.seconds ?? bank.durationSeconds;
    return !Number.isFinite(q.seconds) || !Number.isFinite(end) || q.seconds < 0 ||
      end <= q.seconds || end > bank.durationSeconds;
  });
  if (invalid) {
    skippedBanks.push({ bank: bank.number, reason: 'invalid_interval' });
    continue;
  }
  timestamps.forEach((q, index) => {
    const next = timestamps[index + 1];
    const end = next?.seconds ?? bank.durationSeconds;
    planned.set(`quantitative-computer-bank-${bank.number}-${q.questionNumber}`, {
      videoTimestampSeconds: q.seconds, videoEndTimestampSeconds: end,
      videoTimestampInferred: q.inferred === true, videoEndTimestampInferred: next?.inferred === true,
      videoTimingVerified: false,
    });
  });
}
// Independently checked against raw frames and the original question image:
// at 1934s the video is still Q33; at 1935s Q34 appears.
// at 2009s Q34 is still being solved; at 2010s Q35 appears.
planned.set('quantitative-computer-bank-6-34', {
  videoTimestampSeconds: 1935, videoEndTimestampSeconds: 2010,
  videoTimestampInferred: false, videoEndTimestampInferred: false, videoTimingVerified: true,
});
planned.set('quantitative-computer-bank-46-48', {
  videoTimestampSeconds: 2943, videoEndTimestampSeconds: 2973,
  videoTimestampInferred: false, videoEndTimestampInferred: false, videoTimingVerified: true,
});
await mongoose.connect(process.env.MONGODB_URI);
try {
  const collection = mongoose.connection.collection('questions');
  const rows = await collection.find({ 'source.questionId': { $in: [...planned.keys()] } })
    .project({ _id: 1, 'source.questionId': 1, 'source.videoTimestampSeconds': 1,
      'source.videoEndTimestampSeconds': 1, 'source.videoTimestampInferred': 1,
      'source.videoEndTimestampInferred': 1, 'source.videoTimingVerified': 1 }).toArray();
  if (rows.length !== planned.size) throw new Error(`Expected ${planned.size} questions, found ${rows.length}`);
  const output = 'generated-artifacts/quant-video-review/before-clip-import.json';
  if (!fs.existsSync(output)) fs.writeFileSync(output, JSON.stringify(rows, null, 2));
  const operations = rows.filter((q) => !q.source.videoTimingVerified || q.source.questionId === 'quantitative-computer-bank-6-34')
    .map((q) => ({
      updateOne: { filter: { _id: q._id, 'source.questionId': q.source.questionId },
        update: { $set: Object.fromEntries(Object.entries(planned.get(q.source.questionId))
          .map(([key, value]) => [`source.${key}`, value])) } },
    }));
  const result = await collection.bulkWrite(operations, { ordered: true });
  console.log(JSON.stringify({ matched: result.matchedCount, modified: result.modifiedCount,
    banks: planned.size / 48, intervals: planned.size, skippedBanks,
    approximate: [...planned.values()].filter((q) => q.videoTimestampInferred || q.videoEndTimestampInferred).length,
    verifiedExample: planned.get('quantitative-computer-bank-6-34') }, null, 2));
} finally { await mongoose.disconnect(); }
