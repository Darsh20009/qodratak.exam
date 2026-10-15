import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchR2VerbalObject, writeR2Object } from '../../artifacts/api-server/src/services/qudratVerbalBookFilesService';
import { TAHSILI_SOURCE_CATALOG } from '../../artifacts/api-server/src/services/tahsiliSourceCatalog';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const uploadTimeoutMs = 15 * 60 * 1000;

async function main() {
  let uploaded = 0;
  let skipped = 0;

  for (const source of TAHSILI_SOURCE_CATALOG) {
    const filePath = path.join(workspaceRoot, 'attached_assets', source.originalName);
    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat?.isFile() || stat.size !== source.bytes) {
      throw new Error(`ملف المصدر غير موجود أو حجمه لا يطابق الفهرس: ${source.id}`);
    }

    const existing = await fetchR2VerbalObject(source.objectKey, { method: 'HEAD' });
    const storedBytes = Number(existing.headers.get('content-length') || 0);
    if (existing.ok && storedBytes === source.bytes) {
      skipped += 1;
      console.log(`verified existing ${source.id} (${source.pages} pages)`);
      continue;
    }

    const body = await fs.readFile(filePath);
    await writeR2Object(source.objectKey, body, 'application/pdf', uploadTimeoutMs);
    const verification = await fetchR2VerbalObject(source.objectKey, { method: 'HEAD' });
    const verifiedBytes = Number(verification.headers.get('content-length') || 0);
    if (!verification.ok || verifiedBytes !== source.bytes) {
      throw new Error(`فشل التحقق من الملف بعد رفعه: ${source.id}`);
    }
    uploaded += 1;
    console.log(`uploaded and verified ${source.id} (${source.pages} pages)`);
  }

  console.log(JSON.stringify({
    total: TAHSILI_SOURCE_CATALOG.length,
    uploaded,
    skipped,
    pages: TAHSILI_SOURCE_CATALOG.reduce((sum, source) => sum + source.pages, 0),
    bytes: TAHSILI_SOURCE_CATALOG.reduce((sum, source) => sum + source.bytes, 0),
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'تعذر رفع مصادر التحصيلي');
  process.exitCode = 1;
});
