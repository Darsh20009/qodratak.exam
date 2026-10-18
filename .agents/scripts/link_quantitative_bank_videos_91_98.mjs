import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const videoManifestPath = resolve(root, ".agents/scripts/quantitative-bank-91-98-video-manifest.json");
const timingPath = resolve(root, ".agents/outputs/quantitative-computer-banks/video-timestamps-91-98.json");
const banksPath = resolve(root, ".agents/outputs/quantitative-computer-banks/computer-banks-91-110.json");

const videos = JSON.parse(await readFile(videoManifestPath, "utf8"));
const timingReport = JSON.parse(await readFile(timingPath, "utf8"));
const banksPayload = JSON.parse(await readFile(banksPath, "utf8"));
const banks = Array.isArray(banksPayload) ? banksPayload : banksPayload.banks;
if (!Array.isArray(banks)) throw new Error("The bank import manifest has no banks array.");

const timingByBank = new Map(timingReport.banks.map((bank) => [bank.bankNumber, bank]));
const updated = [];

for (const video of videos) {
  const bank = banks.find((item) => item.number === video.bankNumber);
  const timing = timingByBank.get(video.bankNumber);
  if (!bank || !timing) throw new Error(`Missing bank or timing report for bank ${video.bankNumber}.`);
  bank.video = {
    url: timing.videoUrl,
    durationSeconds: timing.durationSeconds,
    sourceFile: video.sourceFile,
  };

  for (const question of bank.questions) {
    delete question.videoTimestampSeconds;
    delete question.videoTimestampInferred;
    delete question.videoEndTimestampSeconds;
    delete question.videoEndTimestampInferred;
    delete question.videoTimingVerified;
    delete question.videoTimingMethod;
  }

  if (!timing.timingUsable) {
    updated.push({ bank: video.bankNumber, video: true, questionTimings: 0 });
    continue;
  }
  if (timing.questionTimestamps.length !== bank.questions.length) {
    throw new Error(
      `Bank ${video.bankNumber} has ${timing.questionTimestamps.length} timestamps for ${bank.questions.length} questions.`,
    );
  }

  const timestampByQuestion = new Map(
    timing.questionTimestamps.map((entry) => [entry.questionNumber, entry]),
  );
  for (const question of bank.questions) {
    const position = question.questionNumber;
    const current = timestampByQuestion.get(position);
    const next = timestampByQuestion.get(position + 1);
    if (!current || !Number.isInteger(current.seconds)) {
      throw new Error(`Bank ${video.bankNumber} has no valid timestamp for question ${position}.`);
    }
    const endSeconds = next?.seconds ?? Math.floor(timing.durationSeconds);
    if (!Number.isInteger(endSeconds) || endSeconds <= current.seconds) {
      throw new Error(`Bank ${video.bankNumber}, question ${position} has invalid clip bounds.`);
    }
    question.videoTimestampSeconds = current.seconds;
    question.videoTimestampInferred = current.inferred === true;
    question.videoEndTimestampSeconds = endSeconds;
    question.videoEndTimestampInferred = next?.inferred === true;
    question.videoTimingVerified = false;
    question.videoTimingMethod = "visual_badge_detection_5s_samples";
  }
  updated.push({
    bank: video.bankNumber,
    video: true,
    questionTimings: bank.questions.length,
    inferred: timing.inferredQuestions.length,
  });
}

const tempPath = `${banksPath}.tmp`;
await writeFile(tempPath, `${JSON.stringify(banksPayload, null, 2)}\n`, "utf8");
await rename(tempPath, banksPath);
console.log(JSON.stringify(updated, null, 2));
console.log(`Updated ${banksPath}`);
