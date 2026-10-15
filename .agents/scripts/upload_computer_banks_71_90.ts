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
  ".agents/outputs/quantitative-computer-banks/computer-banks-71-90.json",
);
const imageRoot = path.join(
  root,
  "generated-artifacts/quantitative-banks-71-90/source-images",
);
const concurrency = 4;
const dryRun = process.env.COMPUTER_BANKS_UPLOAD_DRY_RUN === "1";

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
  contentType: "image/jpeg" | "image/png";
};

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

async function runConcurrent(
  entries: Entry[],
  label: string,
  operation: (entry: Entry) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  let completed = 0;
  const errors: string[] = [];
  await Promise.all(
    Array.from({ length: Math.min(concurrency, entries.length) }, async () => {
      while (cursor < entries.length) {
        const entry = entries[cursor++];
        try {
          await operation(entry);
        } catch (error) {
          errors.push(error instanceof Error ? `${entry.key}: ${error.message}` : `${entry.key}: ${String(error)}`);
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
    throw new Error(`${errors.length} R2 image operation(s) failed:\n${errors.slice(0, 20).join("\n")}`);
  }
}

async function main() {
  const payload = JSON.parse(await fs.readFile(manifestPath, "utf8")) as {
    sourceRightsConfirmed?: boolean;
    banks: Bank[];
  };
  if (!payload.sourceRightsConfirmed || payload.banks.length !== 20) {
    throw new Error("Expected explicit rights confirmation and exactly 20 banks (71–90).");
  }

  const entries: Entry[] = [];
  for (const bank of payload.banks) {
    if (!Number.isInteger(bank.number) || bank.number < 71 || bank.number > 90 || bank.questions.length !== 48) {
      throw new Error(`Invalid bank payload for bank ${bank.number}.`);
    }
    for (const question of bank.questions) {
      const number = String(question.questionNumber).padStart(3, "0");
      const originalUrl = `/foundation/quantitative/computer-banks/exam-${bank.number}/question-${number}.jpeg`;
      if (question.imageUrl !== originalUrl) {
        throw new Error(`Unexpected original image URL for bank ${bank.number}, question ${number}.`);
      }
      const folder = `exam-${bank.number}`;
      entries.push({
        key: `foundation/quantitative/computer-banks/${folder}/question-${number}.jpeg`,
        filePath: path.join(imageRoot, folder, `question-${number}.jpeg`),
        contentType: "image/jpeg",
      });
      entries.push({
        key: `foundation/quantitative/computer-banks/${folder}/background-removed/question-${number}.png`,
        filePath: path.join(imageRoot, folder, "background-removed", `question-${number}.png`),
        contentType: "image/png",
      });
    }
  }
  if (entries.length !== 1_920) {
    throw new Error(`Expected 1,920 original/cleaned images; found ${entries.length}.`);
  }

  let totalBytes = 0;
  for (const entry of entries) {
    const stat = await fs.stat(entry.filePath);
    if (!stat.isFile() || stat.size === 0) {
      throw new Error(`Required question image is missing or empty: ${entry.filePath}`);
    }
    totalBytes += stat.size;
  }

  if (dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      banks: payload.banks.length,
      questionImages: 960,
      objects: entries.length,
      totalBytes,
      firstKey: entries[0].key,
      lastKey: entries.at(-1)?.key,
    }, null, 2));
    return;
  }

  let uploaded = 0;
  let alreadyPresent = 0;
  await runConcurrent(entries, "R2 upload", async (entry) => {
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
        throw new Error(`Could not verify existing R2 object (${existing.status}).`);
      }
      const remote = Buffer.from(await existing.arrayBuffer());
      if (sha256(remote) !== sha256(local)) {
        throw new Error("Refusing to overwrite a different existing R2 object.");
      }
      alreadyPresent += 1;
      return;
    }
    if (head.status !== 404) {
      throw new Error(`Could not check R2 object (${head.status}).`);
    }
    await writeR2Object(entry.key, local, entry.contentType);
    uploaded += 1;
  });

  let verified = 0;
  await runConcurrent(entries, "R2 verify", async (entry) => {
    const localStat = await fs.stat(entry.filePath);
    const response = await fetchR2VerbalObject(entry.key, {
      method: "HEAD",
      signal: AbortSignal.timeout(30_000),
    });
    const remoteLength = Number(response.headers.get("content-length"));
    if (response.status !== 200 || remoteLength !== localStat.size) {
      throw new Error(`R2 verification failed: status=${response.status}, bytes=${remoteLength}.`);
    }
    verified += 1;
  });

  console.log(JSON.stringify({
    banks: payload.banks.length,
    questionImages: 960,
    objects: entries.length,
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
