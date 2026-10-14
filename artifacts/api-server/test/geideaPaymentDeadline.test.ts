import { test } from "node:test";
import assert from "node:assert/strict";
import { geideaProcessingDeadlinePassed, GEIDEA_PROCESSING_MS, publicGeideaPaymentStatus } from "../src/services/geideaPaymentService";

test("Geidea sessions remain processing for ten minutes, then become due for provider verification", () => {
  const startedAt = new Date("2026-10-13T10:00:00.000Z");
  const started = startedAt.getTime();
  assert.equal(geideaProcessingDeadlinePassed(startedAt, started), false);
  assert.equal(geideaProcessingDeadlinePassed(startedAt, started + GEIDEA_PROCESSING_MS - 1), false);
  assert.equal(geideaProcessingDeadlinePassed(startedAt, started + GEIDEA_PROCESSING_MS), true);
  assert.equal(geideaProcessingDeadlinePassed("invalid", started + GEIDEA_PROCESSING_MS), false);
  assert.equal(geideaProcessingDeadlinePassed(undefined, started + GEIDEA_PROCESSING_MS), false);
});

test("pending and unsuccessful sessions never expose an invoice", () => {
  const payment = {
    _id: "507f1f77bcf86cd799439011",
    createdAt: new Date("2026-10-13T10:00:00Z"),
    startDate: new Date("2026-10-13T10:00:00Z"),
    endDate: new Date("2027-01-13T10:00:00Z"),
    paymentStatus: "pending",
    price: 117,
    type: "ربع سنوي",
  };
  assert.equal(publicGeideaPaymentStatus(payment, { fullName: "Test student" }).invoice, null);
  assert.equal(publicGeideaPaymentStatus({ ...payment, paymentStatus: "failed" }, { fullName: "Test student" }).invoice, null);
});

test("a paid invoice retains the billing identity captured at payment, not later profile changes", () => {
  const result = publicGeideaPaymentStatus({
    _id: "507f1f77bcf86cd799439011",
    createdAt: new Date("2026-10-13T10:00:00Z"),
    paidAt: new Date("2026-10-13T10:01:00Z"),
    startDate: new Date("2026-10-13T10:01:00Z"),
    endDate: new Date("2027-01-13T10:01:00Z"),
    paymentStatus: "paid",
    price: 117,
    type: "ربع سنوي",
    billingSnapshot: { name: "Original student", email: "original@example.invalid", phone: "" },
  }, { fullName: "Changed name", email: "changed@example.invalid" });
  assert.equal(result.invoice?.customerName, "Original student");
  assert.equal(result.invoice?.customerEmail, "original@example.invalid");
  assert.equal(result.invoice?.amount, 117);
  assert.equal(result.invoice?.invoiceNumber, "QDR-2026-99439011");
});
