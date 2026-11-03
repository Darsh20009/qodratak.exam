import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildAdminTestInvoiceMessage,
  normalizeAdminTestInvoicePhone,
} from "../src/services/adminTestInvoice";

test("test invoice phone normalization supports Saudi mobile formats without accepting malformed values", () => {
  assert.equal(normalizeAdminTestInvoicePhone("0532441566"), "966532441566");
  assert.equal(normalizeAdminTestInvoicePhone("+966 53 244 1566"), "966532441566");
  assert.equal(normalizeAdminTestInvoicePhone("530001111"), "966530001111");
  assert.equal(normalizeAdminTestInvoicePhone("abc"), null);
  assert.equal(normalizeAdminTestInvoicePhone("123"), null);
  assert.equal(normalizeAdminTestInvoicePhone(""), null);
});

test("sample invoice is explicitly zero-value and never claims payment", () => {
  const message = buildAdminTestInvoiceMessage("DEMO-2026-ABC12345", new Date("2026-11-03T09:00:00.000Z"));
  assert.match(message, /فاتورة تجريبية — غير مدفوعة/);
  assert.match(message, /رقم النموذج: DEMO-2026-ABC12345/);
  assert.match(message, /الإجمالي: 0\.00 ر\.س/);
  assert.match(message, /لا تمثل عملية دفع أو اشتراكًا/);
  assert.doesNotMatch(message, /تم الدفع|اشتراكك مفعل/);
});

test("admin test invoice endpoint stays authenticated, queued, and separate from payment records", async () => {
  const source = await readFile(new URL("../src/adminRoutes.ts", import.meta.url), "utf8");
  const start = source.indexOf("router.post('/whatsapp/test-invoice'");
  const end = source.indexOf("router.post('/whatsapp/financial-report'", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const route = source.slice(start, end);

  assert.match(route, /requireAdminAuth/);
  assert.match(route, /SendAdminTestInvoiceBody\.safeParse/);
  assert.match(route, /sendWhatsAppText\([\s\S]*'admin_test_invoice'/);
  assert.match(route, /ADMIN_TEST_INVOICE_COOLDOWN_MS/);
  assert.match(route, /SendAdminTestInvoiceResponse\.parse/);
  assert.doesNotMatch(route, /Subscription\.(?:create|update|findOneAndUpdate)/);
});
