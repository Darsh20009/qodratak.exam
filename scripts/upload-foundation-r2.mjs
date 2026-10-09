#!/usr/bin/env node

import { createReadStream, statSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { createHash, createHmac } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SOURCE_ROOT = path.resolve("artifacts/qodratak/public/foundation/quantitative");
const OBJECT_PREFIX = "foundation/quantitative";
const REGION = "auto";
const SERVICE = "s3";
const WORKERS = 2;
const RETRIES = 3;
const MULTIPART_THRESHOLD_BYTES = 128 * 1024 ** 2;
const MULTIPART_PART_BYTES = 64 * 1024 ** 2;

function parseArguments(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }
    const key = argument.slice(2);
    if (key === "upload") {
      values.set(key, true);
      continue;
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    values.set(key, value);
    index += 1;
  }
  return values;
}

function encodePathSegment(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function encodeObjectPath(bucket, key) {
  return `/${encodePathSegment(bucket)}/${key
    .split("/")
    .map(encodePathSegment)
    .join("/")}`;
}

function encodeQueryParameters(parameters) {
  return Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodePathSegment(key)}=${encodePathSegment(String(value))}`)
    .join("&");
}

function hmac(key, value) {
  return createHmac("sha256", key).update(value).digest();
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function signedHeaders({
  method,
  host,
  uri,
  queryString = "",
  payloadHash,
  accessKeyId,
  secretAccessKey,
  contentType,
  metadataHash,
}) {
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const headers = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) headers["content-type"] = contentType;
  if (metadataHash) headers["x-amz-meta-sha256"] = metadataHash;

  const names = Object.keys(headers).sort();
  const canonicalHeaders = `${names.map((name) => `${name}:${headers[name].trim()}\n`).join("")}`;
  const signedHeaderNames = names.join(";");
  const canonicalRequest = [
    method,
    uri,
    queryString,
    canonicalHeaders,
    signedHeaderNames,
    payloadHash,
  ].join("\n");
  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    hash(canonicalRequest),
  ].join("\n");
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), REGION), SERVICE),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames}, Signature=${signature}`;

  return { ...headers, authorization };
}

function contentTypeFor(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".mp4":
    case ".m4v":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".ogv":
    case ".ogg":
      return "video/ogg";
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

async function collectFiles(directory, relativeDirectory = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, relativePath)));
    } else if (entry.isFile()) {
      files.push({
        absolutePath,
        relativePath: relativePath.split(path.sep).join("/"),
      });
    }
  }
  return files;
}

async function sha256File(filePath) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) digest.update(chunk);
  return digest.digest("hex");
}

async function sha256FileRange(filePath, start, end) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(filePath, { start, end })) digest.update(chunk);
  return digest.digest("hex");
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function decodeXml(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function responseError(status, body) {
  const detail = body.trim().replace(/\s+/g, " ").slice(0, 500);
  return new Error(`R2 returned ${status}${detail ? `: ${detail}` : ""}`);
}

export function createR2Client({ accountId, bucket, accessKeyId, secretAccessKey }) {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const emptyPayloadHash = hash("");
  const requestUrl = (uri, queryString = "") =>
    `https://${host}${uri}${queryString ? `?${queryString}` : ""}`;

  async function headObject(key) {
    const uri = encodeObjectPath(bucket, key);
    const headers = signedHeaders({
      method: "HEAD",
      host,
      uri,
      payloadHash: emptyPayloadHash,
      accessKeyId,
      secretAccessKey,
    });
    const response = await fetch(requestUrl(uri), { method: "HEAD", headers });
    const result = {
      status: response.status,
      size: Number(response.headers.get("content-length") || 0),
      sha256: response.headers.get("x-amz-meta-sha256") || "",
    };
    await response.body?.cancel();
    return result;
  }

  async function putObject({ key, filePath, size, sha256, contentType }) {
    const uri = encodeObjectPath(bucket, key);
    const headers = signedHeaders({
      method: "PUT",
      host,
      uri,
      payloadHash: sha256,
      accessKeyId,
      secretAccessKey,
      contentType,
      metadataHash: sha256,
    });
    headers["content-length"] = String(size);
    const response = await fetch(requestUrl(uri), {
      method: "PUT",
      headers,
      body: createReadStream(filePath),
      duplex: "half",
    });
    return { status: response.status, responseText: await response.text() };
  }

  async function putMultipartObject({ key, filePath, size, sha256, contentType }) {
    const uri = encodeObjectPath(bucket, key);
    let uploadId = "";

    try {
      const initiateQuery = encodeQueryParameters({ uploads: "" });
      const initiateHeaders = signedHeaders({
        method: "POST",
        host,
        uri,
        queryString: initiateQuery,
        payloadHash: emptyPayloadHash,
        accessKeyId,
        secretAccessKey,
        contentType,
        metadataHash: sha256,
      });
      const initiateResponse = await fetch(requestUrl(uri, initiateQuery), {
        method: "POST",
        headers: initiateHeaders,
      });
      const initiateText = await initiateResponse.text();
      if (!initiateResponse.ok) throw responseError(initiateResponse.status, initiateText);

      const uploadIdMatch = initiateText.match(/<UploadId>([\s\S]*?)<\/UploadId>/i);
      if (!uploadIdMatch) throw new Error("R2 did not return a multipart upload ID.");
      uploadId = decodeXml(uploadIdMatch[1].trim());

      const parts = [];
      const partCount = Math.ceil(size / MULTIPART_PART_BYTES);
      for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
        const start = (partNumber - 1) * MULTIPART_PART_BYTES;
        const end = Math.min(size - 1, start + MULTIPART_PART_BYTES - 1);
        const partSize = end - start + 1;
        const partHash = await sha256FileRange(filePath, start, end);
        const queryString = encodeQueryParameters({
          partNumber: String(partNumber),
          uploadId,
        });
        let etag = "";

        for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
          try {
            const headers = signedHeaders({
              method: "PUT",
              host,
              uri,
              queryString,
              payloadHash: partHash,
              accessKeyId,
              secretAccessKey,
            });
            headers["content-length"] = String(partSize);
            const response = await fetch(requestUrl(uri, queryString), {
              method: "PUT",
              headers,
              body: createReadStream(filePath, { start, end }),
              duplex: "half",
            });
            const responseText = await response.text();
            if (!response.ok) throw responseError(response.status, responseText);
            etag = response.headers.get("etag") || "";
            if (!etag) throw new Error(`R2 omitted the ETag for multipart part ${partNumber}.`);
            break;
          } catch (error) {
            if (attempt === RETRIES) throw error;
            await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
          }
        }

        parts.push({ partNumber, etag });
      }

      const completeBody = [
        "<CompleteMultipartUpload>",
        ...parts.map(({ partNumber, etag }) =>
          `<Part><PartNumber>${partNumber}</PartNumber><ETag>${escapeXml(etag)}</ETag></Part>`,
        ),
        "</CompleteMultipartUpload>",
      ].join("");
      const completeQuery = encodeQueryParameters({ uploadId });
      const completeHeaders = signedHeaders({
        method: "POST",
        host,
        uri,
        queryString: completeQuery,
        payloadHash: hash(completeBody),
        accessKeyId,
        secretAccessKey,
        contentType: "application/xml",
      });
      const completeResponse = await fetch(requestUrl(uri, completeQuery), {
        method: "POST",
        headers: completeHeaders,
        body: completeBody,
      });
      const completeText = await completeResponse.text();
      if (!completeResponse.ok) throw responseError(completeResponse.status, completeText);
      if (/<Error>/i.test(completeText)) throw new Error(`R2 multipart completion failed: ${completeText.slice(0, 500)}`);
      return { status: completeResponse.status, responseText: completeText };
    } catch (error) {
      if (uploadId) {
        try {
          const abortQuery = encodeQueryParameters({ uploadId });
          const abortHeaders = signedHeaders({
            method: "DELETE",
            host,
            uri,
            queryString: abortQuery,
            payloadHash: emptyPayloadHash,
            accessKeyId,
            secretAccessKey,
          });
          const abortResponse = await fetch(requestUrl(uri, abortQuery), {
            method: "DELETE",
            headers: abortHeaders,
          });
          await abortResponse.body?.cancel();
        } catch {
          console.warn(`Could not abort incomplete multipart upload for ${key}.`);
        }
      }
      throw error;
    }
  }

  return { headObject, putObject, putMultipartObject };
}

async function ensureUploaded(client, file, objectPrefix) {
  const filePath = file.absolutePath;
  const key = `${objectPrefix}/${file.relativePath}`;
  const initialStat = await stat(filePath);
  const sha256 = await sha256File(filePath);
  const finalStat = await stat(filePath);
  if (initialStat.size !== finalStat.size || initialStat.mtimeMs !== finalStat.mtimeMs) {
    throw new Error(`Source changed while hashing: ${file.relativePath}`);
  }

  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    const existing = await client.headObject(key);
    if (existing.status === 200) {
      if (existing.size === finalStat.size && existing.sha256 === sha256) {
        return { uploaded: false, size: finalStat.size };
      }
      throw new Error(`Remote object conflicts with source: ${file.relativePath}`);
    }
    if (existing.status !== 404) {
      throw new Error(`R2 HEAD returned ${existing.status} for ${file.relativePath}`);
    }

    try {
      const put = finalStat.size > MULTIPART_THRESHOLD_BYTES
        ? await client.putMultipartObject({
            key,
            filePath,
            size: finalStat.size,
            sha256,
            contentType: contentTypeFor(filePath),
          })
        : await client.putObject({
        key,
        filePath,
        size: finalStat.size,
        sha256,
        contentType: contentTypeFor(filePath),
      });
      if (put.status < 200 || put.status >= 300) {
        throw responseError(put.status, put.responseText);
      }
      const verified = await client.headObject(key);
      if (verified.status !== 200 || verified.size !== finalStat.size || verified.sha256 !== sha256) {
        throw new Error(`Remote verification failed for ${file.relativePath}`);
      }
      return { uploaded: true, size: finalStat.size };
    } catch (error) {
      if (attempt === RETRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
    }
  }
  throw new Error(`Upload retries exhausted for ${file.relativePath}`);
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const accountId = args.get("account-id");
  const bucket = args.get("bucket");
  const sourceRoot = path.resolve(args.get("source-root") ?? SOURCE_ROOT);
  const objectPrefix = args.get("object-prefix") ?? OBJECT_PREFIX;
  const uploadEnabled = args.has("upload");
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !/^[a-f0-9]{32}$/i.test(accountId)) {
    throw new Error("Pass a valid Cloudflare account ID with --account-id.");
  }
  if (!bucket || !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) {
    throw new Error("Pass a valid R2 bucket name with --bucket.");
  }
  if (
    objectPrefix.startsWith("/") ||
    objectPrefix.endsWith("/") ||
    objectPrefix.split("/").some((segment) => !/^[a-z0-9][a-z0-9-]*$/.test(segment))
  ) {
    throw new Error("Pass a lowercase object prefix with safe path segments.");
  }
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("R2 credential secrets are unavailable to this process.");
  }

  const allFiles = (await collectFiles(sourceRoot)).sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath),
  );
  const limitArgument = args.get("limit");
  const limit = limitArgument === undefined ? allFiles.length : Number(limitArgument);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("--limit must be a positive whole number.");
  }
  const files = allFiles.slice(0, limit);
  const totalBytes = files.reduce((total, file) => total + statSync(file.absolutePath).size, 0);
  console.log(
    `${uploadEnabled ? "Uploading" : "Dry run"} ${files.length}/${allFiles.length} files (${(totalBytes / 1024 ** 3).toFixed(2)} GiB) to s3://${bucket}/${objectPrefix}/`,
  );
  if (!uploadEnabled) {
    console.log("No objects changed. Re-run with --upload to start the resumable transfer.");
    return;
  }

  const client = createR2Client({ accountId, bucket, accessKeyId, secretAccessKey });
  let nextIndex = 0;
  let completed = 0;
  let uploaded = 0;
  let skipped = 0;
  let completedBytes = 0;
  let firstFailure;

  async function worker() {
    while (!firstFailure) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= files.length) return;
      const file = files[index];
      try {
        const result = await ensureUploaded(client, file, objectPrefix);
        completed += 1;
        completedBytes += result.size;
        if (result.uploaded) uploaded += 1;
        else skipped += 1;
        if (completed % 25 === 0 || completed === files.length) {
          console.log(
            `${completed}/${files.length} verified; uploaded=${uploaded}, already-matching=${skipped}, scanned=${(completedBytes / 1024 ** 3).toFixed(2)} GiB`,
          );
        }
      } catch (error) {
        firstFailure = new Error(
          `Stopped at ${file.relativePath}: ${error instanceof Error ? error.message : "unknown error"}`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: WORKERS }, () => worker()));
  if (firstFailure) throw firstFailure;
  console.log(
    `Transfer complete: ${uploaded} uploaded, ${skipped} already matching, ${completedBytes} bytes verified.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "R2 upload failed.");
    process.exitCode = 1;
  });
}