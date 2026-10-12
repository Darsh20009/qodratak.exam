import assert from "node:assert/strict";
import crypto from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import mongoose from "mongoose";
import { Subscription, User } from "../src/mongodb/models";
import { createGeideaPaymentRouter } from "../src/routes/geideaPaymentRoutes";

test("first payment, renewal, private invoice and repeated signed callbacks preserve access and expiry",
  { skip: !process.env.MONGODB_URI, timeout: 120_000 }, async () => {
  const marker = `geidea-fixture-${crypto.randomUUID()}`;
  const savedMode = process.env.GEIDEA_MODE;
  const savedKey = process.env.GEIDEA_TEST_PUBLIC_KEY;
  const savedPassword = process.env.GEIDEA_TEST_API_PASSWORD;
  process.env.GEIDEA_MODE = "sandbox";
  process.env.GEIDEA_TEST_PUBLIC_KEY = "fixture-key";
  process.env.GEIDEA_TEST_API_PASSWORD = "fixture-password";
  const originalFetch = globalThis.fetch;
  let userId = "";
  let otherUserId = "";
  const orders = new Map<string, any[]>();
  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    const target = String(url);
    if (target.startsWith("http://127.0.0.1:")) return originalFetch(url, init);
    if (target.startsWith("https://api.ksamerchant.geidea.net/")) {
      const parsed = new URL(target);
      if (parsed.pathname.endsWith("/session")) {
        return new Response(JSON.stringify({
          responseCode: "000", detailedResponseCode: "000", session: { id: crypto.randomUUID() },
        }), { status: 200 });
      }
      return new Response(JSON.stringify({
        responseCode: "000", detailedResponseCode: "000",
        orders: orders.get(parsed.searchParams.get("MerchantReferenceId") || "") || [],
      }), { status: 200 });
    }
    throw new Error("Unexpected external request in payment verification");
  }) as typeof fetch;
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).session = { userId: req.headers["x-fixture-user"] };
    (req as any).log = { warn() {}, error() {} };
    next();
  });
  app.use("/api", createGeideaPaymentRouter({
    requireAuth(req, res, next) {
      if (!(req as any).session.userId) { res.sendStatus(401); return; }
      next();
    },
    getPlanByKey: async () => ({ type: "Pro", priceSar: 39, durationDays: 90 }),
  }));
  const server = app.listen(0);
  try {
    await once(server, "listening");
    const address = server.address() as import("node:net").AddressInfo;
    const base = `http://127.0.0.1:${address.port}`;
    await mongoose.connect(process.env.MONGODB_URI!);
    const user = await User.create({
      username: marker, fullName: "طالب التحقق", email: `${marker}@example.invalid`,
      password: "test-hash-only", role: "student", notifWhatsApp: false, notifEmail: false,
    });
    userId = String(user._id);
    const otherUser = await User.create({
      username: `${marker}-other`, fullName: "طالب آخر",
      email: `${marker}-other@example.invalid`,
      password: "test-hash-only", role: "student", notifWhatsApp: false,
    });
    otherUserId = String(otherUser._id);
    const request = (path: string, body?: any, identity = userId) => originalFetch(`${base}/api${path}`, {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", ...(identity ? { "x-fixture-user": identity } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const callback = (reference: string, orderId: string, amount = 39, signed = true) => {
      const input = {
        merchantReferenceId: reference, orderId, amount, currency: "SAR",
        status: "Success", timestamp: "2026/10/12 21:00:00",
      };
      const signature = signed ? crypto.createHmac("sha256", "fixture-password")
        .update(`fixture-key${amount.toFixed(2)}SAR${orderId}Success${reference}${input.timestamp}`).digest("base64")
        : "forged";
      return request("/payments/geidea/callback", { ...input, signature }, "");
    };
    const createPayment = async () => {
      const response = await request("/subscription/geidea/sessions", { planKey: "pro", amount: 0 });
      assert.equal(response.status, 201);
      const body = await response.json() as any;
      const payment = await Subscription.findById(body.paymentId);
      assert.ok(payment);
      assert.equal(payment.price, 39, "client amount must not control the charge");
      assert.equal(payment.status, "pending");
      return payment;
    };
    const first = await createPayment();
    const reference = first.providerMerchantReferenceId!;
    assert.equal((await callback(reference, "first-order", 39, false)).status, 401);
    const before = await (await request(`/subscription/geidea/payments/${first._id}`)).json() as any;
    assert.equal(before.invoice, null);
    assert.equal(before.invoiceNumber, null);
    orders.set(reference, [{
      merchantReferenceId: reference, orderId: "first-order", amount: 40,
      currency: "SAR", status: "Success", detailedStatus: "Captured",
    }]);
    await callback(reference, "first-order");
    assert.equal((await Subscription.findById(first._id))!.status, "pending");
    orders.get(reference)![0].amount = 39;
    orders.get(reference)![0].detailedStatus = "Authorized";
    await callback(reference, "first-order");
    assert.equal((await Subscription.findById(first._id))!.status, "pending");
    orders.get(reference)![0].detailedStatus = "Captured";
    await callback(reference, "first-order");
    const firstPaid = await Subscription.findById(first._id);
    assert.equal(firstPaid!.paymentStatus, "paid");
    assert.equal(firstPaid!.endDate.getTime() - firstPaid!.startDate.getTime(), 90 * 86_400_000);
    const savedEnd = firstPaid!.endDate.getTime();
    await Promise.all([callback(reference, "first-order"), callback(reference, "first-order")]);
    assert.equal((await Subscription.findById(first._id))!.endDate.getTime(), savedEnd);
    const invoice = await (await request(`/subscription/geidea/payments/${first._id}`)).json() as any;
    assert.equal(invoice.invoice.status, "active");
    assert.equal(invoice.invoice.amount, 39);
    assert.equal(invoice.invoice.customerName, "طالب التحقق");
    assert.equal(invoice.invoice.endDate, firstPaid!.endDate.toISOString());
    assert.equal(invoice.invoiceNumber, invoice.invoice.invoiceNumber);
    assert.equal((await request(`/subscription/geidea/payments/${first._id}`, undefined, "")).status, 401);
    assert.equal((await request(`/subscription/geidea/payments/${first._id}`, undefined, otherUserId)).status, 404);
    const renewal = await createPayment();
    const renewalReference = renewal.providerMerchantReferenceId!;
    orders.set(renewalReference, [{
      merchantReferenceId: renewalReference, orderId: "renewal-order", amount: 39,
      currency: "SAR", status: "Success", detailedStatus: "Captured",
    }]);
    await Promise.all([callback(renewalReference, "renewal-order"), callback(renewalReference, "renewal-order")]);
    const renewed = await Subscription.findById(renewal._id);
    assert.equal(renewed!.paymentStatus, "paid");
    assert.ok(renewed!.startDate.getTime() <= Date.now());
    assert.equal(renewed!.endDate.getTime(), savedEnd + 90 * 86_400_000);
    const mirror = await User.findById(userId);
    assert.equal(new Date(mirror!.subscription!.endDate!).getTime(), renewed!.endDate.getTime());
    assert.equal(await Subscription.countDocuments({ userId: user._id, paymentStatus: "paid" }), 2);
    // Wait for notification-disabled fixture processing before cleanup.
    for (let i = 0; i < 50; i++) {
      const sending = await Subscription.countDocuments({ userId: user._id, purchaseNotificationState: { $in: ["pending", "sending"] } });
      if (!sending) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal((await Subscription.findById(renewal._id))!.purchaseNotificationState, "skipped");
  } finally {
    globalThis.fetch = originalFetch;
    if (userId) {
      await Subscription.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
      await User.deleteOne({ _id: userId, username: marker });
    }
    if (otherUserId) await User.deleteOne({ _id: otherUserId, username: `${marker}-other` });
    await mongoose.disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    for (const [key, value] of [["GEIDEA_MODE", savedMode], ["GEIDEA_TEST_PUBLIC_KEY", savedKey], ["GEIDEA_TEST_API_PASSWORD", savedPassword]]) {
      if (value === undefined) delete process.env[key!];
      else process.env[key!] = value;
    }
  }
});
