import mongoose from "mongoose";
import sharp from "sharp";
import { Question } from "../mongodb/models";
import { fetchR2VerbalObject, writeR2Object } from "../services/qudratVerbalBookFilesService";

const ASSET_PREFIX = "foundation/quantitative/";
const args = new Set(process.argv.slice(2));
const writeEnabled = args.has("--write");
const requestedLimit = process.argv.find((arg) => arg.startsWith("--limit="))?.slice("--limit=".length);
const limit = requestedLimit ? Number(requestedLimit) : Number.POSITIVE_INFINITY;

function toR2ObjectKey(rawUrl: unknown): string | undefined {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) return undefined;
  let value = rawUrl.trim();
  if (/^https?:\/\//i.test(value)) {
    try {
      value = new URL(value).pathname;
    } catch {
      return undefined;
    }
  }
  value = value.replace(/^\/+/, "").replace(/^api\//, "");
  if (!value.startsWith(ASSET_PREFIX)) return undefined;
  const relativePath = value.slice(ASSET_PREFIX.length);
  if (!/^computer-banks\/exam-\d{2,3}\/(?:background-removed\/)?question-\d{3}\.(?:jpe?g|png|webp)$/i.test(relativePath)) {
    return undefined;
  }
  return value;
}

function thumbnailObjectKey(sourceKey: string): string {
  const relativePath = sourceKey.slice(ASSET_PREFIX.length);
  const slash = relativePath.lastIndexOf("/");
  const directory = relativePath.slice(0, slash + 1);
  const filename = relativePath.slice(slash + 1).replace(/\.(?:jpe?g|png|webp)$/i, "");
  return `${ASSET_PREFIX}${directory}optimized/${filename}.webp`;
}

async function writeThumbnailWithRetry(key: string, body: Buffer): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await writeR2Object(key, body, "image/webp");
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Thumbnail upload failed after retries.");
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is required to read quantitative source question images.");
  if (requestedLimit && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error("--limit must be a positive integer.");
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10_000 });
  try {
    const sourceKeys = new Set<string>();
    const cursor = Question.find({ category: "quantitative" })
      .select("imageUrl imageUrls")
      .lean()
      .cursor();
    for await (const question of cursor) {
      for (const candidate of [question.imageUrl, ...(Array.isArray(question.imageUrls) ? question.imageUrls : [])]) {
        const sourceKey = toR2ObjectKey(candidate);
        if (sourceKey) sourceKeys.add(sourceKey);
      }
    }

    const sources = Array.from(sourceKeys).sort().slice(0, limit);
    if (!sources.length) throw new Error("No quantitative question-bank source images matched the approved R2 path.");
    console.log(`${writeEnabled ? "Generating" : "Plan only"}: ${sources.length} unique source images.`);
    if (!writeEnabled) {
      console.log("Run again with --write to create missing WebP derivatives; original objects are never changed.");
      return;
    }

    const totals = {
      created: 0,
      alreadyPresent: 0,
      fallbackQuality: 0,
      notSmallerThanSource: 0,
      missingSource: 0,
      failed: 0,
      sourceBytesProcessed: 0,
      derivativeBytesCreated: 0,
    };
    const createdExamples: string[] = [];
    let completed = 0;
    let nextIndex = 0;
    const workers = Array.from({ length: 8 }, async () => {
      while (nextIndex < sources.length) {
        const sourceKey = sources[nextIndex++];
        const derivativeKey = thumbnailObjectKey(sourceKey);
        try {
          const existing = await fetchR2VerbalObject(derivativeKey, { method: "HEAD" });
          if (existing.ok) {
            totals.alreadyPresent += 1;
            continue;
          }
          if (existing.status !== 404) throw new Error(`Derivative check failed (${existing.status}).`);

          const source = await fetchR2VerbalObject(sourceKey);
          if (source.status === 404) {
            totals.missingSource += 1;
            continue;
          }
          if (!source.ok) throw new Error(`Source fetch failed (${source.status}).`);
          const original = Buffer.from(await source.arrayBuffer());
          if (!original.length) throw new Error("Source object is empty.");
          totals.sourceBytesProcessed += original.length;

          let derivative = await sharp(original, { failOn: "error", limitInputPixels: 60_000_000 })
            .rotate()
            .resize({ width: 1800, height: 2400, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 86, effort: 5, smartSubsample: true })
            .toBuffer();
          if (derivative.length >= original.length * 0.98) {
            derivative = await sharp(original, { failOn: "error", limitInputPixels: 60_000_000 })
              .rotate()
              .resize({ width: 1400, height: 1900, fit: "inside", withoutEnlargement: true })
              .webp({ quality: 78, effort: 5, smartSubsample: true })
              .toBuffer();
            totals.fallbackQuality += 1;
          }
          const derivativeMetadata = await sharp(derivative).metadata();
          if (derivativeMetadata.format !== "webp") throw new Error("Generated image is not WebP.");

          if (derivative.length >= original.length) totals.notSmallerThanSource += 1;
          await writeThumbnailWithRetry(derivativeKey, derivative);
          totals.created += 1;
          totals.derivativeBytesCreated += derivative.length;
          if (createdExamples.length < 3) createdExamples.push(derivativeKey);
        } catch (error) {
          totals.failed += 1;
          console.error(`One image could not be processed: ${error instanceof Error ? error.message : "unknown error"}`);
        } finally {
          completed += 1;
          if (completed % 250 === 0 || completed === sources.length) {
            console.log(`Processed ${completed}/${sources.length} images.`);
          }
        }
      }
    });
    await Promise.all(workers);
    console.log(JSON.stringify({ selected: sources.length, createdExamples, ...totals }));
    if (totals.failed) process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : "Thumbnail generation failed.");
  process.exitCode = 1;
});
