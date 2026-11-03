import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../src/pages/admin/WhatsAppAdminTab.tsx", import.meta.url), "utf8");

test("admin WhatsApp tab exposes a clearly marked zero-value demo invoice", () => {
  assert.match(page, /إرسال فاتورة تجريبية/);
  assert.match(page, /تجريبي — غير مدفوع/);
  assert.match(page, /0/);
  assert.match(page, /useSendAdminTestInvoice/);
  assert.match(page, /sendTest\.mutate\(\{ data: \{ phone: phone\.trim\(\) \} \}\)/);
  assert.match(page, /button-admin-test-invoice-send/);
  assert.doesNotMatch(page, /\/api\/admin\/whatsapp\/test-message/);
  assert.doesNotMatch(page, /0532441566/);
});
