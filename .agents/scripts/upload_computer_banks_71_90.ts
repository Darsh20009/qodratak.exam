import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchR2VerbalObject,
  writeR2Object,
} from "../../artifacts/api-server/src/services/qudratVerbalBookFilesService";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const bankStart = Number(process.env.COMPUTER_BANKS_START || 71);
const bankEnd = Number(process.env.COMPUTER_BANKS_END || 90);
const rangeName = `${bankStart}-${bankEnd}`;
const expectedBankCount = bankEnd - bankStart + 1;
const expectedQuestionCount = expectedBankCount * 48;
const manifestPath = path.join(
  root,
  `.agents/outputs/quantitative-computer-banks/computer-banks-${rangeName}.json`,
);
const imageRoot = path.join(
  root,
  `generated-artifacts/quantitative-banks-${rangeName}/source-images`,
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
  if (!Number.isInteger(bankStart) || !Number.isInteger(bankEnd) || expectedBankCount < 1
    || !payload.sourceRightsConfirmed || payload.banks.length !== expectedBankCount) {
    throw new Error(`Expected explicit rights confirmation and exactly ${expectedBankCount} banks (${rangeName}).`);
  }

  const entries: Entry[] = [];
  for (const bank of payload.banks) {
    if (!Number.isInteger(bank.number) || bank.number < bankStart || bank.number > bankEnd || bank.questions.length !== 48) {
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
  if (entries.length !== expectedQuestionCount * 2) {
    throw new Error(`Expected ${expectedQuestionCount * 2} original/cleaned images; found ${entries.length}.`);
  }
  const requestedKeys = new Set(
    (process.env.COMPUTER_BANKS_UPLOAD_ONLY || "")
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean),
  );
  const uploadEntries = requestedKeys.size
    ? entries.filter((entry) => requestedKeys.has(entry.key))
    : entries;
  if (requestedKeys.size && uploadEntries.length !== requestedKeys.size) {
    const found = new Set(uploadEntries.map((entry) => entry.key));
    throw new Error(
      `Unknown upload key(s): ${[...requestedKeys].filter((key) => !found.has(key)).join(", ")}`,
    );
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
      questionImages: expectedQuestionCount,
      objects: entries.length,
      uploadObjects: uploadEntries.length,
      totalBytes,
      firstKey: entries[0].key,
      lastKey: entries.at(-1)?.key,
    }, null, 2));
    return;
  }

  let uploaded = 0;
  let alreadyPresent = 0;
  await runConcurrent(uploadEntries, "R2 upload", async (entry) => {
    const local = await fs.readFile(entry.filePath);
    const head = await fetchR2WithRetry(entry.key, {
      method: "HEAD",
    });
    if (head.status === 200) {
      const existing = await fetchR2WithRetry(entry.key);
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

  let verified = 0;
  await runConcurrent(entries, "R2 verify", async (entry) => {
    const localStat = await fs.stat(entry.filePath);
    const response = await fetchR2WithRetry(entry.key, { method: "HEAD" });
    const remoteLength = Number(response.headers.get("content-length"));
    if (response.status !== 200 || remoteLength !== localStat.size) {
      throw new Error(`R2 verification failed: status=${response.status}, bytes=${remoteLength}.`);
    }
    verified += 1;
  });

  console.log(JSON.stringify({
    banks: payload.banks.length,
    questionImages: expectedQuestionCount,
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
