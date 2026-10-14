import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Append new versions rather than replacing these files: issued contracts keep
// their original identity, signature, seal and hashes.
export const institutionIssuerName = "مشاري عواض حسن الثبيتي";
export const institutionIssuerPlatform = "منصة قدراتك التعليمية";
const assetIds = ["mishari-signature-20261013", "qodratak-stamp-20261013"] as const;
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const roots = [
  path.resolve(moduleDir, "private-assets/institutions"),
  path.resolve(moduleDir, "../../private-assets/institutions"),
  path.resolve(process.cwd(), "private-assets/institutions"),
  path.resolve(process.cwd(), "artifacts/api-server/private-assets/institutions"),
];
const assets = new Map(assetIds.map(id => {
  const filename = roots.map(root => path.join(root, `${id}.png`)).find(existsSync);
  if (!filename) throw new Error(`Missing institutional contract asset: ${id}`);
  const bytes = readFileSync(filename);
  return [id as string, { bytes, sha256: createHash("sha256").update(bytes).digest("hex") }] as const;
}));
export const institutionIssuerAssets = {
  signatureAssetId: assetIds[0], signatureSha256: assets.get(assetIds[0])!.sha256,
  stampAssetId: assetIds[1], stampSha256: assets.get(assetIds[1])!.sha256,
};
export function getInstitutionIssuerAsset(id: string) {
  return assets.get(id);
}
