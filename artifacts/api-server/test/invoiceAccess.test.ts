import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createInvoiceAccessToken,
  createSubscriptionInvoiceUrl,
  verifyInvoiceAccessToken,
} from "../src/services/invoiceAccess";

const paidSubscription = {
  _id: "507f1f77bcf86cd799439011",
  userId: "student-42",
  paidAt: new Date("2026-11-03T10:15:00.000Z"),
  approvedAt: new Date("2026-11-03T10:15:00.000Z"),
  createdAt: new Date("2026-11-03T09:00:00.000Z"),
};

test("invoice capability is bound to one subscription, owner, and payment time", () => {
  const token = createInvoiceAccessToken(paidSubscription, "unit-test-secret");
  assert.ok(token);
  assert.equal(verifyInvoiceAccessToken(paidSubscription, token, "unit-test-secret"), true);
  assert.equal(verifyInvoiceAccessToken({ ...paidSubscription, userId: "someone-else" }, token, "unit-test-secret"), false);
  assert.equal(verifyInvoiceAccessToken({ ...paidSubscription, _id: "507f1f77bcf86cd799439012" }, token, "unit-test-secret"), false);
  assert.equal(verifyInvoiceAccessToken({ ...paidSubscription, paidAt: new Date("2026-11-03T10:16:00.000Z") }, token, "unit-test-secret"), false);
  assert.equal(verifyInvoiceAccessToken(paidSubscription, `${token}x`, "unit-test-secret"), false);
  assert.equal(verifyInvoiceAccessToken(paidSubscription, token, "different-secret"), false);
});

test("invoice share URL keeps its access capability in the fragment", () => {
  const originalSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = "unit-test-secret";
  try {
    const sharedUrl = createSubscriptionInvoiceUrl(paidSubscription, "https://qodratak.example");
    assert.ok(sharedUrl);
    const parsed = new URL(sharedUrl);
    assert.equal(parsed.pathname, "/payment/geidea/invoice");
    assert.equal(parsed.searchParams.get("paymentId"), paidSubscription._id);
    assert.equal(parsed.searchParams.has("access"), false);
    const token = new URLSearchParams(parsed.hash.slice(1)).get("access");
    assert.ok(token);
    assert.equal(verifyInvoiceAccessToken(paidSubscription, token), true);
    assert.equal(createSubscriptionInvoiceUrl(paidSubscription, "not a URL"), null);
  } finally {
    if (originalSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSecret;
  }
});

test("invoice links are not created without a session signing secret", () => {
  assert.equal(createInvoiceAccessToken(paidSubscription, ""), null);
});
