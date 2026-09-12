import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const EXPECTED_VIDEO_COUNT = 200;
export const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
export const SOURCE_PATH = new URL("../src/data/verbalBankVideos.ts", import.meta.url);
export const REQUEST_TIMEOUT_MS = 15_000;
export const MAX_REQUEST_ATTEMPTS = 3;
export const RETRY_BACKOFF_MS = 500;
export const TOTAL_REQUEST_TIMEOUT_MS = 45_000;
export const MAX_CONCURRENT_REQUESTS = 8;

function printErrors(errors) {
  console.error("Verbal bank validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
}

export function getVideoIds(source) {
  const listMatch = source.match(
    /const verbalBankVideoIds = \[\n(?<entries>[\s\S]*?)\n\] as const;/,
  );

  if (!listMatch?.groups?.entries) {
    return {
      ids: [],
      errors: ["Could not find the verbal bank video ID list in verbalBankVideos.ts."],
    };
  }

  const ids = [];
  const errors = [];
  const entries = listMatch.groups.entries
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const entryMatch = entry.match(/^"([^"]+)",?$/);
    if (!entryMatch) {
      errors.push(`Invalid video ID entry syntax: ${entry}`);
      continue;
    }
    ids.push(entryMatch[1]);
  }

  return { ids, errors };
}

export function validateVideoData(source, ids) {
  const errors = [];

  if (ids.length !== EXPECTED_VIDEO_COUNT) {
    errors.push(
      `Expected exactly ${EXPECTED_VIDEO_COUNT} verbal bank videos, but found ${ids.length}.`,
    );
  }

  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate YouTube video ID(s): ${duplicateIds.join(", ")}.`);
  }

  ids.forEach((id, index) => {
    if (!VIDEO_ID_PATTERN.test(id)) {
      errors.push(
        `Video ${index + 1} has invalid YouTube ID "${id}". IDs must contain exactly 11 letters, numbers, "_" or "-".`,
      );
    }
  });

  if (!source.includes("videoUrl: `https://www.youtube.com/watch?v=${videoId}`")) {
    errors.push(
      "Video URLs must use the expected YouTube watch URL format: https://www.youtube.com/watch?v={id}.",
    );
  }

  ids.forEach((id, index) => {
    const videoUrl = `https://www.youtube.com/watch?v=${id}`;
    try {
      const parsedUrl = new URL(videoUrl);
      if (
        parsedUrl.protocol !== "https:" ||
        parsedUrl.hostname !== "www.youtube.com" ||
        parsedUrl.pathname !== "/watch" ||
        parsedUrl.searchParams.get("v") !== id
      ) {
        errors.push(`Video ${index + 1} has an invalid YouTube URL: ${videoUrl}.`);
      }
    } catch {
      errors.push(`Video ${index + 1} has an invalid YouTube URL: ${videoUrl}.`);
    }
  });

  return errors;
}

function isRetryableNetworkError(error) {
  if (error?.name === "AbortError" || error?.name === "TypeError") {
    return true;
  }

  const errorCode = error?.code ?? error?.cause?.code;
  return ["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN", "ENOTFOUND"].includes(
    errorCode,
  );
}

function formatNetworkError(error, timeoutMs) {
  if (error?.name === "AbortError") {
    return `timed out after ${timeoutMs}ms`;
  }

  return `network error: ${error?.message || String(error)}`;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function checkVideoLink(
  id,
  index,
  {
    fetchImpl = fetch,
    requestTimeoutMs = REQUEST_TIMEOUT_MS,
    maxRequestAttempts = MAX_REQUEST_ATTEMPTS,
    retryBackoffMs = RETRY_BACKOFF_MS,
    totalTimeoutMs = TOTAL_REQUEST_TIMEOUT_MS,
  } = {},
) {
  const videoUrl = `https://www.youtube.com/watch?v=${id}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
  const deadline = Date.now() + totalTimeoutMs;
  let attempts = 0;
  let lastNetworkError;

  while (attempts < maxRequestAttempts) {
    const remainingTime = deadline - Date.now();
    if (remainingTime <= 0) {
      break;
    }

    attempts += 1;
    const attemptTimeoutMs = Math.min(requestTimeoutMs, remainingTime);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), attemptTimeoutMs);

    try {
      const response = await fetchImpl(oembedUrl, {
        headers: { "user-agent": "Qodratak-verbal-bank-validator/1.0" },
        signal: controller.signal,
      });

      if (!response.ok) {
        return `Video ${index + 1} (${id}) is not reachable: YouTube returned HTTP ${response.status} for ${videoUrl}.`;
      }

      try {
        await response.json();
      } catch {
        return `Video ${index + 1} (${id}) is not reachable: YouTube returned an invalid response for ${videoUrl}.`;
      }

      return null;
    } catch (error) {
      if (!isRetryableNetworkError(error)) {
        return `Video ${index + 1} (${id}) could not be checked: ${formatNetworkError(error, attemptTimeoutMs)} (${videoUrl}).`;
      }

      lastNetworkError = formatNetworkError(error, attemptTimeoutMs);
    } finally {
      clearTimeout(timeout);
    }

    if (attempts >= maxRequestAttempts) {
      break;
    }

    const backoffMs = retryBackoffMs * 2 ** (attempts - 1);
    const remainingAfterAttempt = deadline - Date.now();
    if (remainingAfterAttempt <= backoffMs) {
      break;
    }
    await wait(backoffMs);
  }

  const timeoutMessage =
    Date.now() >= deadline
      ? `within the total timeout of ${totalTimeoutMs}ms`
      : `after ${attempts} attempts`;
  return `Video ${index + 1} (${id}) could not be checked ${timeoutMessage}: ${lastNetworkError ?? "temporary network failure"} (${videoUrl}).`;
}

export async function checkLinks(ids, options = {}) {
  const errors = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < ids.length) {
      const index = nextIndex++;
      const error = await checkVideoLink(ids[index], index, options);
      if (error) {
        errors.push(error);
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(MAX_CONCURRENT_REQUESTS, ids.length) },
      () => worker(),
    ),
  );

  return errors.sort((left, right) => left.localeCompare(right));
}

export async function main() {
  const source = await readFile(SOURCE_PATH, "utf8");
  const { ids, errors: extractionErrors } = getVideoIds(source);
  const dataErrors = validateVideoData(source, ids);
  const structuralErrors = [...extractionErrors, ...dataErrors];

  if (structuralErrors.length > 0) {
    printErrors(structuralErrors);
    return 1;
  } else {
    console.log(
      `Validated ${ids.length} unique verbal bank video IDs and YouTube URL formats.`,
    );
    const linkErrors = await checkLinks(ids);

    if (linkErrors.length > 0) {
      printErrors(linkErrors);
      return 1;
    } else {
      console.log(`Verified that all ${ids.length} YouTube video links are reachable.`);
      return 0;
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}