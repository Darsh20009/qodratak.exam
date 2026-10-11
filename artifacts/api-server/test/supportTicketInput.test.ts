import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { normalizeSupportPhone, SupportTicketInputError, validateSupportTicketInput } from "../src/services/supportTicketInput";

const valid = { userName: "عميل تجريبي", userPhone: "0501234567", userEmail: "test@example.com", message: "شكوى تجريبية للتحقق من النموذج.", requestId: randomUUID() };
test("ticket validation normalizes contacts and ignores client privilege fields", () => {
  const result = validateSupportTicketInput({ ...valid, userEmail: " TEST@EXAMPLE.COM ", status: "resolved", userId: "fake", priority: "urgent" });
  assert.equal(result.userPhone, "966501234567");
  assert.equal(result.userEmail, "test@example.com");
  assert.equal("status" in result, false);
  assert.equal("userId" in result, false);
  assert.equal(result.requestFingerprint, validateSupportTicketInput(valid).requestFingerprint);
});
test("Saudi, Arabic-digit and international phone formats normalize safely", () => {
  assert.equal(normalizeSupportPhone("٠٥٠١٢٣٤٥٦٧"), "966501234567");
  assert.equal(normalizeSupportPhone("+966 50 123 4567"), "966501234567");
  assert.equal(normalizeSupportPhone("00966501234567"), "966501234567");
  assert.equal(normalizeSupportPhone("+44 7700 900123"), "447700900123");
  assert.equal(normalizeSupportPhone("not-a-phone"), "");
});
test("invalid, oversized, bot and non-idempotent submissions fail explicitly", () => {
  for (const change of [{ userName: "x" }, { userEmail: "bad" }, { userPhone: "12" }, { message: "short" }, { message: "x".repeat(4001) }, { website: "bot" }, { requestId: "missing" }]) {
    assert.throws(() => validateSupportTicketInput({ ...valid, ...change }), SupportTicketInputError);
  }
});
