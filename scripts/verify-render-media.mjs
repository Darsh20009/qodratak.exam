import { execFileSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createR2Client } from "./upload-foundation-r2.mjs";

// Read-only verification. Credentials stay in the process, never in the output.
const client = createR2Client({
  accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID,
  bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
});
if (!process.env.CLOUDFLARE_R2_ACCOUNT_ID || !process.env.CLOUDFLARE_R2_BUCKET_NAME ||
    !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
  throw new Error("Configure the existing Cloudflare R2 environment before verification.");
}
const root = "artifacts/qodratak/public/";
async function localVideos(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) paths.push(...await localVideos(file));
    else if (entry.isFile() && /\.mp4$/i.test(file)) paths.push(file);
  }
  return paths;
}
const paths = await localVideos(`${root}foundation/quantitative`);
if (!paths.length) throw new Error("No local originals are available for content comparison.");
const lfsOutput = JSON.parse(execFileSync("git", ["lfs", "ls-files", "--json"], { encoding: "utf8" }));
const lfs = new Map((Array.isArray(lfsOutput) ? lfsOutput : lfsOutput.files).map(f => [f.name, f]));
let verifiedBytes = 0;
for (const file of paths) {
  const local = await stat(file);
  let digest = lfs.get(file)?.oid;
  if (!digest) {
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(file)) hash.update(chunk);
    digest = hash.digest("hex");
  }
  const remote = await client.headObject(file.slice(root.length));
  if (remote.status !== 200 || remote.size !== local.size || remote.sha256 !== digest) {
    throw new Error(`Hosted media verification failed: ${file} (HTTP ${remote.status}, size/hash mismatch). Originals remain untouched.`);
  }
  verifiedBytes += local.size;
}
const verbalSource = await readFile("artifacts/api-server/src/services/qudratVerbalBookFilesService.ts", "utf8");
const verbalKeys = [...new Set([...verbalSource.matchAll(/objectKey:\s*"([^"]+)"/g)].map(m => m[1]))];
for (const key of verbalKeys) {
  const remote = await client.headObject(key);
  if (remote.status !== 200 || remote.size <= 0) {
    throw new Error(`Hosted verbal media is unavailable: ${key} (HTTP ${remote.status}).`);
  }
}
console.log(JSON.stringify({ quantitativeVideosVerified: paths.length, quantitativeBytesVerified: verifiedBytes, verbalFilesVerified: verbalKeys.length, uploadsPerformed: 0 }));
