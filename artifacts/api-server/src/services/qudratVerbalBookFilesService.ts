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

export type QudratVerbalBookFileId = (typeof QUDRAT_VERBAL_BOOK_FILES)[number]["id"];
export type QudratVerbalBookFile = (typeof QUDRAT_VERBAL_BOOK_FILES)[number];

export function getQudratVerbalBookFile(
  fileId: string,
): QudratVerbalBookFile | undefined {
  return QUDRAT_VERBAL_BOOK_FILES.find((file) => file.id === fileId);
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

export async function fetchQudratVerbalBookFile(
  fileId: string,
  options: { method?: "GET" | "HEAD"; range?: string } = {},
): Promise<Response> {
  const file = getQudratVerbalBookFile(fileId);
  if (!file) {
    throw new VerbalBookFileStorageError("Verbal book PDF was not found.", 404);
  }

  const { accountId, bucket, accessKeyId, secretAccessKey } = getR2Config();
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const uri = `/${encodePathSegment(bucket)}/${file.objectKey
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