import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { fetchR2VerbalObject, isR2Configured, writeR2Object } from "./qudratVerbalBookFilesService";

// Even a public media bucket receives encrypted ciphertext, never the signed PDF.
// Keep SESSION_SECRET backed up and stable; rotating it requires migrating these objects.
function storageKey() {
  if (!process.env.SESSION_SECRET) throw new Error("مفتاح حماية العقود غير مهيأ");
  return createHash("sha256").update("qodratak-institution-contract-v1\0")
    .update(process.env.SESSION_SECRET).digest();
}
export function sealContract(buffer: Buffer, context: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", storageKey(), nonce);
  cipher.setAAD(Buffer.from(context));
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([Buffer.from("QIC1"), nonce, cipher.getAuthTag(), encrypted]);
}
export function openContract(buffer: Buffer, context: string) {
  if (buffer.length < 32 || buffer.subarray(0, 4).toString() !== "QIC1") throw new Error("ملف عقد غير صالح");
  const decipher = createDecipheriv("aes-256-gcm", storageKey(), buffer.subarray(4, 16));
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(buffer.subarray(16, 32));
  return Buffer.concat([decipher.update(buffer.subarray(32)), decipher.final()]);
}
export function contractStorageReady() { return isR2Configured() && Boolean(process.env.SESSION_SECRET); }
export function validateSignedPdf(buffer: Buffer) {
  if (buffer.length < 20 || buffer.length > 12 * 1024 * 1024 ||
      !buffer.subarray(0, 5).equals(Buffer.from("%PDF-")) ||
      !buffer.subarray(-1024).includes(Buffer.from("%%EOF"))) throw new Error("ارفع ملف PDF صالحًا لا يزيد عن ١٢ ميجابايت");
  if (/\/(?:JavaScript|JS|Launch|EmbeddedFile|RichMedia)\b/.test(buffer.toString("latin1"))) {
    throw new Error("لا تُقبل العقود التي تحتوي على برامج أو مرفقات تنفيذية");
  }
}
export async function storeSignedContract(buffer: Buffer, context: string) {
  validateSignedPdf(buffer);
  const objectKey = `institution-contracts/${randomUUID()}.sealed`;
  await writeR2Object(objectKey, sealContract(buffer, context));
  return { objectKey, sha256: createHash("sha256").update(buffer).digest("hex"), bytes: buffer.length };
}
export async function loadSignedContract(objectKey: string, context: string, expectedHash: string) {
  const response = await fetchR2VerbalObject(objectKey, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error("تعذر استرجاع نسخة العقد الموقعة");
  const buffer = openContract(Buffer.from(await response.arrayBuffer()), context);
  if (createHash("sha256").update(buffer).digest("hex") !== expectedHash) throw new Error("فشل التحقق من سلامة العقد");
  return buffer;
}
