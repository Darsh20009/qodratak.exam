import { execFileSync } from "node:child_process";
import { mkdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fetchR2VerbalObject, writeR2File } from "../../artifacts/api-server/src/services/qudratVerbalBookFilesService";

type BankVideo = { bankNumber: number; sourceFile: string };

async function main() {
  const root = resolve(process.cwd(), "..");
  const manifestPath = resolve(root, ".agents/scripts/quantitative-bank-51-70-video-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as BankVideo[];
  const attached = resolve(root, "attached_assets");
  const normalized = resolve(root, "generated-artifacts/quantitative-bank-51-70/normalized");
  await mkdir(normalized, { recursive: true });

  for (const item of manifest) {
    const sourcePath = resolve(attached, item.sourceFile);
    const isQuickTime = item.sourceFile.toLowerCase().endsWith(".mov");
    const uploadPath = isQuickTime
      ? resolve(normalized, `computer-bank-${item.bankNumber}.mp4`)
      : sourcePath;
    const objectKey = `foundation/quantitative/computer-banks/computer-bank-${item.bankNumber}.mp4`;

    if (isQuickTime) {
      const sourceInfo = await stat(sourcePath);
      let outputInfo = await stat(uploadPath).catch(() => null);
      if (!outputInfo || outputInfo.size === 0 || outputInfo.mtimeMs < sourceInfo.mtimeMs) {
        execFileSync("ffmpeg", [
          "-hide_banner", "-loglevel", "error", "-y",
          "-i", sourcePath, "-map", "0:v:0", "-map", "0:a?",
          "-c", "copy", "-movflags", "+faststart", uploadPath,
        ], { stdio: "inherit" });
        outputInfo = await stat(uploadPath);
      }
      console.log(`Bank ${item.bankNumber}: original MOV ${sourceInfo.size} bytes; remuxed MP4 ${outputInfo.size} bytes.`);
    }

    const fileInfo = await stat(uploadPath);
    const remote = await fetchR2VerbalObject(objectKey, { method: "HEAD" });
    const remoteLength = Number(remote.headers.get("content-length") ?? 0);
    if (remote.ok && remoteLength === fileInfo.size) {
      console.log(`Bank ${item.bankNumber}: already present in R2 (${fileInfo.size} bytes).`);
      continue;
    }

    console.log(`Bank ${item.bankNumber}: uploading ${fileInfo.size} bytes to R2.`);
    await writeR2File(objectKey, uploadPath, "video/mp4", 3_600_000);

    const verified = await fetchR2VerbalObject(objectKey, { method: "HEAD" });
    const verifiedLength = Number(verified.headers.get("content-length") ?? 0);
    if (!verified.ok || verifiedLength !== fileInfo.size) {
      throw new Error(`R2 verification failed for bank ${item.bankNumber}.`);
    }
    console.log(`Bank ${item.bankNumber}: uploaded and size-verified (${fileInfo.size} bytes).`);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
