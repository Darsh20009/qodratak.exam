import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchR2VerbalObject,
  writeR2Object,
} from "../../artifacts/api-server/src/services/qudratVerbalBookFilesService";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const rangeName = process.env.COMPUTER_BANKS_RANGE ?? "111-130";
const manifestPath = path.join(
  root,
  `.agents/outputs/quantitative-computer-banks/computer-banks-${rangeName}.json`,
);
const imageRoot = path.join(
  root,
  rangeName === "131"
    ? "generated-artifacts/quantitative-bank-131/source-images"
    : `generated-artifacts/quantitative-banks-${rangeName}/source-images`,
);
const concurrency = 4;
const dryRun = process.env.COMPUTER_BANKS_UPLOAD_DRY_RUN === "1";
const verifyOnly = process.env.COMPUTER_BANKS_UPLOAD_VERIFY_ONLY === "1";
const expectedBankNumbers = rangeName === "131"
  ? [131]
  : [
    ...Array.from({ length: 13 }, (_, index) => 111 + index),
    ...Array.from({ length: 6 }, (_, index) => 125 + index),
  ];

type Question = {
  questionNumber: number;
  imageUrl: string;
  imageOriginalUrl: string;
  imageUrls: string[];
  imageOriginalUrls: string[];
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

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchR2WithRetry(key: string, options: RequestInit = {}): Promise<Response> {
  const { signal: _signal, ...requestOptions } = options;
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetchR2VerbalObject(key, {
        ...requestOptions,
        signal: AbortSignal.timeout(30_000),
      });
      if (response.status < 500 || attempt === 4) return response;
      await response.body?.cancel().catch(() => {});
      lastError = new Error(`Temporary R2 response ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 4) await delay(500 * 2 ** (attempt - 1));
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
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
          errors.push(
            error instanceof Error ? `${entry.key}: ${error.message}` : `${entry.key}: ${String(error)}`,
          );
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
  if (payload.sourceRightsConfirmed !== true
    || !Array.isArray(payload.banks)
    || payload.banks.length !== expectedBankNumbers.length) {
    throw new Error(`Expected explicit permission and the 19 source-usable banks (${rangeName}).`);
  }

  const entries: Entry[] = [];
  const seenBanks = new Set<number>();
  const seenQuestionIds = new Set<string>();
  for (const bank of payload.banks) {
    if (!Number.isInteger(bank.number)
      || !expectedBankNumbers.includes(bank.number)
      || seenBanks.has(bank.number) || !Array.isArray(bank.questions) || bank.questions.length < 40) {
      throw new Error(`Invalid bank payload for bank ${bank.number}.`);
    }
    seenBanks.add(bank.number);
    for (const question of bank.questions) {
      const number = String(question.questionNumber).padStart(3, "0");
      const sourceQuestionId = `${bank.number}-${question.questionNumber}`;
      const baseUrl = `/foundation/quantitative/computer-banks/exam-${bank.number}`;
      const originalUrl = `${baseUrl}/question-${number}.jpeg`;
      const cleanedUrl = `${baseUrl}/background-removed/question-${number}.png`;
      if (!Number.isInteger(question.questionNumber) || question.questionNumber < 1
        || question.questionNumber > 99 || seenQuestionIds.has(sourceQuestionId)
        || question.imageOriginalUrl !== originalUrl
        || question.imageUrl !== cleanedUrl
        || JSON.stringify(question.imageOriginalUrls) !== JSON.stringify([originalUrl])
        || JSON.stringify(question.imageUrls) !== JSON.stringify([cleanedUrl])) {
        throw new Error(`Invalid image manifest for bank ${bank.number}, question ${number}.`);
      }
      seenQuestionIds.add(sourceQuestionId);
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
  if (expectedBankNumbers.some((number) => !seenBanks.has(number))
    || seenBanks.size !== expectedBankNumbers.length
    || entries.length !== seenQuestionIds.size * 2) {
    throw new Error("The bank/image manifest contains missing banks or duplicate questions.");
  }

  let totalBytes = 0;
  for (const entry of entries) {
    const stat = await fs.stat(entry.filePath);
    if (!stat.isFile() || stat.size === 0) {
      throw new Error(`Required question image is missing or empty: ${entry.filePath}`);
    }
    totalBytes += stat.size;
  }

  if (dryRun && verifyOnly) {
    throw new Error("Choose either upload dry-run or R2 verification-only mode.");
  }
  if (dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      banks: seenBanks.size,
      questionImages: seenQuestionIds.size,
      objects: entries.length,
      totalBytes,
      firstKey: entries[0]?.key,
      lastKey: entries.at(-1)?.key,
    }, null, 2));
    return;
  }

  let uploaded = 0;
  let alreadyPresent = 0;
  if (!verifyOnly) {
    await runConcurrent(entries, "R2 upload", async (entry) => {
      const local = await fs.readFile(entry.filePath);
      const head = await fetchR2WithRetry(entry.key, { method: "HEAD" });
      if (head.status === 200) {
        const existing = await fetchR2WithRetry(entry.key);
        if (!existing.ok) throw new Error(`Could not verify existing R2 object (${existing.status}).`);
        const remote = Buffer.from(await existing.arrayBuffer());
        if (sha256(remote) !== sha256(local)) {
          throw new Error("Refusing to overwrite a different existing R2 object.");
        }
        alreadyPresent += 1;
        return;
      }
      if (head.status !== 404) throw new Error(`Could not check R2 object (${head.status}).`);

      let writeError: unknown;
      for (let attempt = 1; attempt <= 4; attempt += 1) {
        try {
          await writeR2Object(entry.key, local, entry.contentType);
          writeError = undefined;
          break;
        } catch (error) {
          writeError = error;
          const afterWrite = await fetchR2WithRetry(entry.key, { method: "HEAD" }).catch(() => null);
          if (afterWrite?.status === 200) {
            const existing = await fetchR2WithRetry(entry.key);
            if (existing.ok && sha256(Buffer.from(await existing.arrayBuffer())) === sha256(local)) {
              writeError = undefined;
              break;
            }
            if (existing.ok) throw new Error("Refusing to overwrite a different existing R2 object.");
          }
          if (attempt < 4) await delay(500 * 2 ** (attempt - 1));
        }
      }
      if (writeError) {
        throw writeError instanceof Error ? writeError : new Error(String(writeError));
      }
      uploaded += 1;
    });
  }

  let verified = 0;
  await runConcurrent(entries, "R2 verify", async (entry) => {
    const localStat = await fs.stat(entry.filePath);
    const response = await fetchR2WithRetry(entry.key);
    if (!response.ok) throw new Error(`R2 GET verification failed (${response.status}).`);
    const remote = Buffer.from(await response.arrayBuffer());
    const remoteLength = remote.length;
    const remoteType = response.headers.get("content-type")?.split(";")[0];
    if (remoteLength !== localStat.size
      || remoteType !== entry.contentType
      || sha256(remote) !== sha256(await fs.readFile(entry.filePath))) {
      throw new Error(
        `R2 SHA-256/size/MIME verification failed: bytes=${remoteLength}, type=${remoteType}.`,
      );
    }
    verified += 1;
  });

  console.log(JSON.stringify({
    banks: seenBanks.size,
    questionImages: seenQuestionIds.size,
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
