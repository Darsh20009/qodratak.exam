import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchR2VerbalObject,
  writeR2Object,
} from "../../artifacts/api-server/src/services/qudratVerbalBookFilesService";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(
  root,
  ".agents/outputs/quantitative-computer-banks/computer-banks-51-70.json",
);
const stagingRoot = path.join(root, "generated-artifacts/computer-banks-51-70");
const dryRun = process.env.COMPUTER_BANKS_UPLOAD_DRY_RUN === "1";
const verifyOnly = process.env.COMPUTER_BANKS_UPLOAD_VERIFY_ONLY === "1";
const onlyKey = process.env.COMPUTER_BANKS_UPLOAD_ONLY_KEY;
const concurrency = 8;

type Question = {
  questionNumber: number;
  imageUrl: string;
};

type Bank = {
  number: number;
  questions: Question[];
};

type Entry = {
  key: string;
  filePath: string;
  contentType: string;
};

function contentTypeFor(extension: string): string {
  switch (extension.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      throw new Error(`Unsupported question image extension: ${extension}`);
  }
}

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

async function forEachConcurrent<T>(
  entries: T[],
  limit: number,
  label: string,
  operation: (entry: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  let completed = 0;
  const errors: string[] = [];
  await Promise.all(
    Array.from({ length: Math.min(limit, entries.length) }, async () => {
      while (cursor < entries.length) {
        const entry = entries[cursor++];
        try {
          await operation(entry);
        } catch (error) {
          const key = (entry as { key?: unknown } | null)?.key;
          const prefix = typeof key === "string" ? `${key}: ` : "";
          errors.push(`${prefix}${error instanceof Error ? error.message : String(error)}`);
        } finally {
          completed += 1;
          if (completed % 100 === 0 || completed === entries.length) {
            console.log(`${label}: ${completed}/${entries.length}`);
          }
        }
      }
    }),
  );
  if (errors.length) {
    throw new Error(
      `${errors.length} R2 image operation(s) failed:\n${errors.slice(0, 20).join("\n")}`,
    );
  }
}

async function main() {
  const payload = JSON.parse(await fs.readFile(manifestPath, "utf8")) as {
    banks: Bank[];
  };
  if (!Array.isArray(payload.banks) || payload.banks.length !== 20) {
    throw new Error("Expected exactly 20 banks in the 51–70 import manifest.");
  }

  const entries: Entry[] = [];
  for (const bank of payload.banks) {
    if (!Number.isInteger(bank.number) || bank.number < 51 || bank.number > 70) {
      throw new Error(`Unexpected bank number in manifest: ${bank.number}`);
    }
    if (!Array.isArray(bank.questions) || bank.questions.length !== 48) {
      throw new Error(`Bank ${bank.number} must contain exactly 48 questions.`);
    }
    for (const question of bank.questions) {
      const match = question.imageUrl.match(
        /^\/foundation\/quantitative\/(computer-banks\/exam-(?:5[1-9]|6\d|70)\/question-\d{3}\.(jpe?g|png|webp))$/,
      );
      if (!match || !Number.isInteger(question.questionNumber)) {
        throw new Error(
          `Invalid question image URL for bank ${bank.number}, question ${question.questionNumber}.`,
        );
      }
      const relative = match[1];
      entries.push({
        key: `foundation/quantitative/${relative}`,
        filePath: path.join(stagingRoot, relative.replace(/^computer-banks\//, "")),
        contentType: contentTypeFor(match[2]),
      });
      const number = String(question.questionNumber).padStart(3, "0");
      const cleanedRelative =
        `computer-banks/exam-${bank.number}/background-removed/question-${number}.png`;
      entries.push({
        key: `foundation/quantitative/${cleanedRelative}`,
        filePath: path.join(stagingRoot, cleanedRelative.replace(/^computer-banks\//, "")),
        contentType: "image/png",
      });
    }
  }

  if (entries.length !== 1_920) {
    throw new Error(`Expected 1,920 original/cleaned question images, found ${entries.length}.`);
  }

  let totalBytes = 0;
  for (const entry of entries) {
    const stat = await fs.stat(entry.filePath);
    if (!stat.isFile() || stat.size === 0) {
      throw new Error(`Question image is missing or empty: ${entry.filePath}`);
    }
    totalBytes += stat.size;
  }

  if (dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      banks: payload.banks.length,
      objects: entries.length,
      totalBytes,
      firstKey: entries[0].key,
      lastKey: entries.at(-1)?.key,
    }, null, 2));
    return;
  }

  if (verifyOnly) {
    const missing: string[] = [];
    const sizeMismatches: string[] = [];
    await forEachConcurrent(entries, concurrency, "R2 preflight", async (entry) => {
      const response = await fetchR2VerbalObject(entry.key, {
        method: "HEAD",
        signal: AbortSignal.timeout(30_000),
      });
      if (response.status === 404) {
        missing.push(entry.key);
        return;
      }
      const remoteLength = Number(response.headers.get("content-length"));
      const localLength = (await fs.stat(entry.filePath)).size;
      if (response.status !== 200) {
        throw new Error(`Could not inspect R2 object: status=${response.status}`);
      }
      if (remoteLength !== localLength) sizeMismatches.push(entry.key);
    });
    console.log(JSON.stringify({
      verifyOnly: true,
      objects: entries.length,
      missing,
      sizeMismatches,
    }, null, 2));
    return;
  }

  const operationEntries = onlyKey
    ? entries.filter((entry) => entry.key === onlyKey)
    : entries;
  if (onlyKey && operationEntries.length !== 1) {
    throw new Error(`The requested repair key is not in the 51–70 manifest: ${onlyKey}`);
  }

  let uploaded = 0;
  let alreadyPresent = 0;
  await forEachConcurrent(operationEntries, concurrency, "R2 upload", async (entry) => {
    const local = await fs.readFile(entry.filePath);
    const head = await fetchR2VerbalObject(entry.key, {
      method: "HEAD",
      signal: AbortSignal.timeout(30_000),
    });
    if (head.status === 200) {
      const existing = await fetchR2VerbalObject(entry.key, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!existing.ok) {
        throw new Error(`Could not verify existing R2 object ${entry.key}: ${existing.status}`);
      }
      const remote = Buffer.from(await existing.arrayBuffer());
      if (sha256(remote) !== sha256(local)) {
        throw new Error(`Refusing to overwrite a different R2 object: ${entry.key}`);
      }
      alreadyPresent++;
      return;
    }
    if (head.status !== 404) {
      throw new Error(`Could not check R2 object ${entry.key}: ${head.status}`);
    }
    await writeR2Object(entry.key, local, entry.contentType);
    uploaded++;
  });

  let verified = 0;
  await forEachConcurrent(operationEntries, concurrency, "R2 verify", async (entry) => {
    const localStat = await fs.stat(entry.filePath);
    const response = await fetchR2VerbalObject(entry.key, {
      method: "HEAD",
      signal: AbortSignal.timeout(30_000),
    });
    const remoteLength = Number(response.headers.get("content-length"));
    if (response.status !== 200 || remoteLength !== localStat.size) {
      throw new Error(
        `R2 verification failed for ${entry.key}: status=${response.status}, bytes=${remoteLength}`,
      );
    }
    verified++;
  });

  console.log(JSON.stringify({
    banks: payload.banks.length,
    images: entries.length,
    operationImages: operationEntries.length,
    uploaded,
    alreadyPresent,
    verified,
    totalBytes,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
