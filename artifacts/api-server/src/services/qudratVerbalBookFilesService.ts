import { createHash, createHmac } from "node:crypto";

export const QUDRAT_VERBAL_BOOK_FILES = [
  {
    id: "sentence-completion",
    section: "إكمال الجمل",
    title: "ملخص الـ95: إكمال الجمل",
    downloadName: "ملخص الـ95 لإكمال الجمل.pdf",
    objectKey: "foundation/verbal/computerized-files/sentence-completion.pdf",
  },
  {
    id: "reading-comprehension",
    section: "استيعاب المقروء",
    title: "ملخص الـ95: استيعاب المقروء",
    downloadName: "ملخص الـ95 لاستيعاب المقروء.pdf",
    objectKey: "foundation/verbal/computerized-files/reading-comprehension.pdf",
  },
  {
    id: "contextual-error",
    section: "الخطأ السياقي",
    title: "ملخص الـ95: الخطأ السياقي",
    downloadName: "ملخص الـ95 للخطأ السياقي.pdf",
    objectKey: "foundation/verbal/computerized-files/contextual-error.pdf",
  },
  {
    id: "verbal-analogy",
    section: "التناظر اللفظي",
    title: "ملخص الـ95: التناظر اللفظي",
    downloadName: "ملخص الـ95 للتناظر اللفظي.pdf",
    objectKey: "foundation/verbal/computerized-files/verbal-analogy.pdf",
  },
] as const;

export const QUDRAT_VERBAL_ANALOGY_VIDEOS = [
  {
    id: "analogy-01",
    lesson: 1,
    durationSeconds: 3573,
    title: "التناظر اللفظي — الدرس ١",
    downloadName: "التناظر اللفظي - الدرس ١.mp4",
    objectKey: "foundation/verbal/computerized-videos/analogy/lesson-01.mp4",
  },
  {
    id: "analogy-02",
    lesson: 2,
    durationSeconds: 3040,
    title: "التناظر اللفظي — الدرس ٢",
    downloadName: "التناظر اللفظي - الدرس ٢.mp4",
    objectKey: "foundation/verbal/computerized-videos/analogy/lesson-02.mp4",
  },
  {
    id: "analogy-03",
    lesson: 3,
    durationSeconds: 2509,
    title: "التناظر اللفظي — الدرس ٣",
    downloadName: "التناظر اللفظي - الدرس ٣.mp4",
    objectKey: "foundation/verbal/computerized-videos/analogy/lesson-03.mp4",
  },
  {
    id: "analogy-04",
    lesson: 4,
    durationSeconds: 2638,
    title: "التناظر اللفظي — الدرس ٤",
    downloadName: "التناظر اللفظي - الدرس ٤.mp4",
    objectKey: "foundation/verbal/computerized-videos/analogy/lesson-04.mp4",
  },
  {
    id: "analogy-05",
    lesson: 5,
    durationSeconds: 2443,
    title: "التناظر اللفظي — الدرس ٥",
    downloadName: "التناظر اللفظي - الدرس ٥.mp4",
    objectKey: "foundation/verbal/computerized-videos/analogy/lesson-05.mp4",
  },
  {
    id: "analogy-06",
    lesson: 6,
    durationSeconds: 2016,
    title: "التناظر اللفظي — الدرس ٦",
    downloadName: "التناظر اللفظي - الدرس ٦.mp4",
    objectKey: "foundation/verbal/computerized-videos/analogy/lesson-06.mp4",
  },
] as const;

export const QUDRAT_VERBAL_SENTENCE_COMPLETION_VIDEOS = [
  {
    id: "sentence-completion-01",
    lesson: 1,
    durationSeconds: 2998,
    title: "إكمال الجمل — الدرس ١",
    downloadName: "إكمال الجمل - الدرس ١.mp4",
    objectKey: "foundation/verbal/computerized-videos/sentence-completion/lesson-01.mp4",
  },
  {
    id: "sentence-completion-02",
    lesson: 2,
    durationSeconds: 2764,
    title: "إكمال الجمل — الدرس ٢",
    downloadName: "إكمال الجمل - الدرس ٢.mp4",
    objectKey: "foundation/verbal/computerized-videos/sentence-completion/lesson-02.mp4",
  },
  {
    id: "sentence-completion-03",
    lesson: 3,
    durationSeconds: 2525,
    title: "إكمال الجمل — الدرس ٣",
    downloadName: "إكمال الجمل - الدرس ٣.mp4",
    objectKey: "foundation/verbal/computerized-videos/sentence-completion/lesson-03.mp4",
  },
  {
    id: "sentence-completion-04",
    lesson: 4,
    durationSeconds: 2144,
    title: "إكمال الجمل — الدرس ٤",
    downloadName: "إكمال الجمل - الدرس ٤.mp4",
    objectKey: "foundation/verbal/computerized-videos/sentence-completion/lesson-04.mp4",
  },
  {
    id: "sentence-completion-05",
    lesson: 5,
    durationSeconds: 1786,
    title: "إكمال الجمل — الدرس ٥",
    downloadName: "إكمال الجمل - الدرس ٥.mp4",
    objectKey: "foundation/verbal/computerized-videos/sentence-completion/lesson-05.mp4",
  },
] as const;

export const QUDRAT_VERBAL_CONTEXTUAL_ERROR_VIDEOS = [
  {
    id: "contextual-error-01",
    lesson: 1,
    durationSeconds: 2041,
    title: "الخطأ السياقي — الدرس ١",
    downloadName: "الخطأ السياقي - الدرس ١.mp4",
    objectKey: "foundation/verbal/computerized-videos/contextual-error/lesson-01.mp4",
  },
  {
    id: "contextual-error-02",
    lesson: 2,
    durationSeconds: 2122,
    title: "الخطأ السياقي — الدرس ٢",
    downloadName: "الخطأ السياقي - الدرس ٢.mp4",
    objectKey: "foundation/verbal/computerized-videos/contextual-error/lesson-02.mp4",
  },
  {
    id: "contextual-error-03",
    lesson: 3,
    durationSeconds: 1858,
    title: "الخطأ السياقي — الدرس ٣",
    downloadName: "الخطأ السياقي - الدرس ٣.mp4",
    objectKey: "foundation/verbal/computerized-videos/contextual-error/lesson-03.mp4",
  },
] as const;

export const QUDRAT_VERBAL_READING_COMPREHENSION_VIDEOS = [
  {
    id: "reading-comprehension-01",
    lesson: 1,
    durationSeconds: 3336,
    title: "استيعاب المقروء — الدرس ١",
    downloadName: "استيعاب المقروء - الدرس ١.mp4",
    objectKey: "foundation/verbal/computerized-videos/reading-comprehension/lesson-01.mp4",
  },
  {
    id: "reading-comprehension-02",
    lesson: 2,
    durationSeconds: 3008,
    title: "استيعاب المقروء — الدرس ٢",
    downloadName: "استيعاب المقروء - الدرس ٢.mp4",
    objectKey: "foundation/verbal/computerized-videos/reading-comprehension/lesson-02.mp4",
  },
  {
    id: "reading-comprehension-03",
    lesson: 3,
    durationSeconds: 2786,
    title: "استيعاب المقروء — الدرس ٣",
    downloadName: "استيعاب المقروء - الدرس ٣.mp4",
    objectKey: "foundation/verbal/computerized-videos/reading-comprehension/lesson-03.mp4",
  },
  {
    id: "reading-comprehension-04",
    lesson: 4,
    durationSeconds: 2999,
    title: "استيعاب المقروء — الدرس ٤",
    downloadName: "استيعاب المقروء - الدرس ٤.mp4",
    objectKey: "foundation/verbal/computerized-videos/reading-comprehension/lesson-04.mp4",
  },
  {
    id: "reading-comprehension-05",
    lesson: 5,
    durationSeconds: 2465,
    title: "استيعاب المقروء — الدرس ٥",
    downloadName: "استيعاب المقروء - الدرس ٥.mp4",
    objectKey: "foundation/verbal/computerized-videos/reading-comprehension/lesson-05.mp4",
  },
  {
    id: "reading-comprehension-06",
    lesson: 6,
    durationSeconds: 2595,
    title: "استيعاب المقروء — الدرس ٦",
    downloadName: "استيعاب المقروء - الدرس ٦.mp4",
    objectKey: "foundation/verbal/computerized-videos/reading-comprehension/lesson-06.mp4",
  },
  {
    id: "reading-comprehension-07",
    lesson: 7,
    durationSeconds: 2564,
    title: "استيعاب المقروء — الدرس ٧",
    downloadName: "استيعاب المقروء - الدرس ٧.mp4",
    objectKey: "foundation/verbal/computerized-videos/reading-comprehension/lesson-07.mp4",
  },
  {
    id: "reading-comprehension-08",
    lesson: 8,
    durationSeconds: 2577,
    title: "استيعاب المقروء — الدرس ٨",
    downloadName: "استيعاب المقروء - الدرس ٨.mp4",
    objectKey: "foundation/verbal/computerized-videos/reading-comprehension/lesson-08.mp4",
  },
  {
    id: "reading-comprehension-09",
    lesson: 9,
    durationSeconds: 3910,
    title: "استيعاب المقروء — الدرس ٩",
    downloadName: "استيعاب المقروء - الدرس ٩.mp4",
    objectKey: "foundation/verbal/computerized-videos/reading-comprehension/lesson-09.mp4",
  },
] as const;

export const QUDRAT_VERBAL_COMPUTERIZED_VIDEOS = [
  ...QUDRAT_VERBAL_ANALOGY_VIDEOS,
  ...QUDRAT_VERBAL_SENTENCE_COMPLETION_VIDEOS,
  ...QUDRAT_VERBAL_CONTEXTUAL_ERROR_VIDEOS,
  ...QUDRAT_VERBAL_READING_COMPREHENSION_VIDEOS,
] as const;

export type QudratVerbalComputerizedVideo =
  (typeof QUDRAT_VERBAL_COMPUTERIZED_VIDEOS)[number];

export function getQudratVerbalComputerizedVideo(
  videoId: string,
): QudratVerbalComputerizedVideo | undefined {
  return QUDRAT_VERBAL_COMPUTERIZED_VIDEOS.find((video) => video.id === videoId);
}

export type QudratVerbalBookFileId = (typeof QUDRAT_VERBAL_BOOK_FILES)[number]["id"];
export type QudratVerbalBookFile = (typeof QUDRAT_VERBAL_BOOK_FILES)[number];
export type QudratVerbalAnalogyVideoId = (typeof QUDRAT_VERBAL_ANALOGY_VIDEOS)[number]["id"];
export type QudratVerbalAnalogyVideo = (typeof QUDRAT_VERBAL_ANALOGY_VIDEOS)[number];
export type QudratVerbalSentenceCompletionVideoId =
  (typeof QUDRAT_VERBAL_SENTENCE_COMPLETION_VIDEOS)[number]["id"];
export type QudratVerbalSentenceCompletionVideo =
  (typeof QUDRAT_VERBAL_SENTENCE_COMPLETION_VIDEOS)[number];
export type QudratVerbalContextualErrorVideoId =
  (typeof QUDRAT_VERBAL_CONTEXTUAL_ERROR_VIDEOS)[number]["id"];
export type QudratVerbalContextualErrorVideo =
  (typeof QUDRAT_VERBAL_CONTEXTUAL_ERROR_VIDEOS)[number];
export type QudratVerbalReadingComprehensionVideoId =
  (typeof QUDRAT_VERBAL_READING_COMPREHENSION_VIDEOS)[number]["id"];
export type QudratVerbalReadingComprehensionVideo =
  (typeof QUDRAT_VERBAL_READING_COMPREHENSION_VIDEOS)[number];

export function getQudratVerbalBookFile(
  fileId: string,
): QudratVerbalBookFile | undefined {
  return QUDRAT_VERBAL_BOOK_FILES.find((file) => file.id === fileId);
}

export function getQudratVerbalAnalogyVideo(
  videoId: string,
): QudratVerbalAnalogyVideo | undefined {
  return QUDRAT_VERBAL_ANALOGY_VIDEOS.find((video) => video.id === videoId);
}

export function getQudratVerbalSentenceCompletionVideo(
  videoId: string,
): QudratVerbalSentenceCompletionVideo | undefined {
  return QUDRAT_VERBAL_SENTENCE_COMPLETION_VIDEOS.find((video) => video.id === videoId);
}

export function getQudratVerbalContextualErrorVideo(
  videoId: string,
): QudratVerbalContextualErrorVideo | undefined {
  return QUDRAT_VERBAL_CONTEXTUAL_ERROR_VIDEOS.find((video) => video.id === videoId);
}

export function getQudratVerbalReadingComprehensionVideo(
  videoId: string,
): QudratVerbalReadingComprehensionVideo | undefined {
  return QUDRAT_VERBAL_READING_COMPREHENSION_VIDEOS.find((video) => video.id === videoId);
}

export class VerbalBookFileStorageError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "VerbalBookFileStorageError";
  }
}

function getR2Config() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (
    !accountId ||
    !/^[a-f0-9]{32}$/i.test(accountId) ||
    !bucket ||
    !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket) ||
    !accessKeyId ||
    !secretAccessKey
  ) {
    throw new VerbalBookFileStorageError(
      "Cloudflare R2 is not configured for verbal study files.",
      503,
    );
  }

  return { accountId, bucket, accessKeyId, secretAccessKey };
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: string | Buffer, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function signR2Request({
  method,
  host,
  uri,
  accessKeyId,
  secretAccessKey,
  range,
}: {
  method: "GET" | "HEAD";
  host: string;
  uri: string;
  accessKeyId: string;
  secretAccessKey: string;
  range?: string;
}): Record<string, string> {
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = hash("");
  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (range) headers.range = range;

  const headerNames = Object.keys(headers).sort();
  const canonicalHeaders = headerNames
    .map((name) => `${name}:${headers[name].trim()}\n`)
    .join("");
  const signedHeaderNames = headerNames.join(";");
  const canonicalRequest = [
    method,
    uri,
    "",
    canonicalHeaders,
    signedHeaderNames,
    payloadHash,
  ].join("\n");
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    hash(canonicalRequest),
  ].join("\n");
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), "auto"), "s3"),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`,
  };
}

async function fetchR2VerbalObject(
  objectKey: string,
  options: { method?: "GET" | "HEAD"; range?: string } = {},
): Promise<Response> {
  const { accountId, bucket, accessKeyId, secretAccessKey } = getR2Config();
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const uri = `/${encodePathSegment(bucket)}/${objectKey
    .split("/")
    .map(encodePathSegment)
    .join("/")}`;
  const method = options.method ?? "GET";
  const range = options.range?.trim();

  if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) {
    throw new VerbalBookFileStorageError("Only a single byte range is supported.", 416);
  }

  const headers = signR2Request({
    method,
    host,
    uri,
    accessKeyId,
    secretAccessKey,
    range,
  });

  return fetch(`https://${host}${uri}`, {
    method,
    headers,
    redirect: "error",
  });
}

export async function fetchQudratVerbalBookFile(
  fileId: string,
  options: { method?: "GET" | "HEAD"; range?: string } = {},
): Promise<Response> {
  const file = getQudratVerbalBookFile(fileId);
  if (!file) {
    throw new VerbalBookFileStorageError("Verbal book PDF was not found.", 404);
  }
  return fetchR2VerbalObject(file.objectKey, options);
}

export async function fetchQudratVerbalAnalogyVideo(
  videoId: string,
  options: { method?: "GET" | "HEAD"; range?: string } = {},
): Promise<Response> {
  const video = getQudratVerbalAnalogyVideo(videoId);
  if (!video) {
    throw new VerbalBookFileStorageError("Verbal analogy video was not found.", 404);
  }
  return fetchR2VerbalObject(video.objectKey, options);
}

export async function fetchQudratVerbalSentenceCompletionVideo(
  videoId: string,
  options: { method?: "GET" | "HEAD"; range?: string } = {},
): Promise<Response> {
  const video = getQudratVerbalSentenceCompletionVideo(videoId);
  if (!video) {
    throw new VerbalBookFileStorageError("Verbal sentence-completion video was not found.", 404);
  }
  return fetchR2VerbalObject(video.objectKey, options);
}

export async function fetchQudratVerbalContextualErrorVideo(
  videoId: string,
  options: { method?: "GET" | "HEAD"; range?: string } = {},
): Promise<Response> {
  const video = getQudratVerbalContextualErrorVideo(videoId);
  if (!video) {
    throw new VerbalBookFileStorageError("Verbal contextual-error video was not found.", 404);
  }
  return fetchR2VerbalObject(video.objectKey, options);
}

export async function fetchQudratVerbalReadingComprehensionVideo(
  videoId: string,
  options: { method?: "GET" | "HEAD"; range?: string } = {},
): Promise<Response> {
  const video = getQudratVerbalReadingComprehensionVideo(videoId);
  if (!video) {
    throw new VerbalBookFileStorageError("Verbal reading-comprehension video was not found.", 404);
  }
  return fetchR2VerbalObject(video.objectKey, options);
}