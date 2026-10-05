import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import {
  createGeideaSession,
  createSessionSignature,
  GeideaRequestError,
  geideaPaymentIsSuccessful,
  verifyGeideaCallbackSignature,
} from "../src/services/geideaService";

test("Geidea session signature uses the two-decimal amount and request fields", () => {
  const input = {
    publicKey: "sandbox-public",
    amount: 12.5,
    currency: "SAR",
    merchantReferenceId: "a3ad8f4a-9d9c-4f29-9df2-13762b692d77",
    timestamp: "2026/10/01 12:30:45",
    apiPassword: "sandbox-password",
  };
  const expected = crypto
    .createHmac("sha256", input.apiPassword)
    .update(`${input.publicKey}12.50${input.currency}${input.merchantReferenceId}${input.timestamp}`, "utf8")
    .digest("base64");

  assert.equal(createSessionSignature(input), expected);
});

test("Geidea callback signature is rejected when a signed payment field changes", () => {
  const input = {
    publicKey: "sandbox-public",
    amount: 25,
    currency: "SAR",
    orderId: "order-123",
    status: "Success",
    merchantReferenceId: "a3ad8f4a-9d9c-4f29-9df2-13762b692d77",
    timestamp: "2026/10/01 12:30:45",
    apiPassword: "sandbox-password",
  };
  const signature = crypto
    .createHmac("sha256", input.apiPassword)
    .update(
      `${input.publicKey}25.00${input.currency}${input.orderId}${input.status}${input.merchantReferenceId}${input.timestamp}`,
      "utf8",
    )
    .digest("base64");

  assert.equal(verifyGeideaCallbackSignature({ ...input, signature }), true);
  assert.equal(verifyGeideaCallbackSignature({ ...input, amount: 26, signature }), false);
});

test("Geidea activates only a successful, captured order matching its expected reference and amount", () => {
  const expected = {
    merchantReferenceId: "a3ad8f4a-9d9c-4f29-9df2-13762b692d77",
    amount: 40,
  };
  const order = {
    merchantReferenceId: expected.merchantReferenceId,
    amount: 40,
    currency: "SAR",
    status: "Success",
    detailedStatus: "Captured",
  };

  assert.equal(geideaPaymentIsSuccessful(order, expected), true);
  assert.equal(geideaPaymentIsSuccessful({ ...order, amount: 41 }, expected), false);
  assert.equal(geideaPaymentIsSuccessful({ ...order, currency: "USD" }, expected), false);
  assert.equal(geideaPaymentIsSuccessful({ ...order, merchantReferenceId: "another-order" }, expected), false);
  assert.equal(geideaPaymentIsSuccessful({ ...order, detailedStatus: "Authorized" }, expected), false);
});

test("Geidea session uses the KSA v2 endpoint and returns the HPP checkout URL", async () => {
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  const previousFetch = globalThis.fetch;
  const previousPublicKey = process.env.GEIDEA_TEST_PUBLIC_KEY;
  const previousApiPassword = process.env.GEIDEA_TEST_API_PASSWORD;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(
      JSON.stringify({
        responseCode: "000",
        detailedResponseCode: "000",
        session: { id: "session/id +?" },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;
  process.env.GEIDEA_TEST_PUBLIC_KEY = "unit-test-public-key";
  process.env.GEIDEA_TEST_API_PASSWORD = "unit-test-api-password";

  try {
    const result = await createGeideaSession({
      amount: 12.5,
      merchantReferenceId: "unit-test-reference",
      callbackUrl: "https://example.test/api/payments/geidea/callback",
      returnUrl: "https://example.test/payment/geidea/return?paymentId=unit-test-payment",
      customer: { email: "test@example.test" },
    });

    assert.equal(
      requestUrl,
      "https://api.ksamerchant.geidea.net/payment-intent/api/v2/direct/session",
    );
    assert.equal(requestInit?.method, "POST");
    assert.equal(
      new Headers(requestInit?.headers).get("authorization"),
      `Basic ${Buffer.from("unit-test-public-key:unit-test-api-password").toString("base64")}`,
    );

    const body = JSON.parse(String(requestInit?.body));
    assert.equal(body.amount, 12.5);
    assert.equal(body.currency, "SAR");
    assert.equal(body.merchantReferenceId, "unit-test-reference");
    assert.equal(body.callbackUrl, "https://example.test/api/payments/geidea/callback");
    assert.equal(body.returnUrl, "https://example.test/payment/geidea/return?paymentId=unit-test-payment");
    assert.equal(typeof body.timestamp, "string");
    assert.equal(typeof body.signature, "string");

    assert.equal(result.sessionId, "session/id +?");
    assert.equal(
      result.checkoutUrl,
      "https://www.ksamerchant.geidea.net/hpp/checkout/?session%2Fid%20%2B%3F",
    );
  } finally {
    globalThis.fetch = previousFetch;
    if (previousPublicKey === undefined) delete process.env.GEIDEA_TEST_PUBLIC_KEY;
    else process.env.GEIDEA_TEST_PUBLIC_KEY = previousPublicKey;
    if (previousApiPassword === undefined) delete process.env.GEIDEA_TEST_API_PASSWORD;
    else process.env.GEIDEA_TEST_API_PASSWORD = previousApiPassword;
  }
});

test("Geidea session errors retain only bounded provider diagnostics", async () => {
  const previousFetch = globalThis.fetch;

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        responseCode: 110,
        responseMessage: "Request rejected",
        detailedResponseCode: "SIG-001",
        detailedResponseMessage: "Invalid signature\u0000check merchant settings",
        session: { id: "must-not-be-retained" },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    )) as typeof fetch;

  try {
    await assert.rejects(
      createGeideaSession({
        amount: 12.5,
        merchantReferenceId: "unit-test-reference",
        callbackUrl: "https://example.test/api/payments/geidea/callback",
        returnUrl: "https://example.test/payment/geidea/return?paymentId=unit-test-payment",
      }),
      (error: unknown) => {
        assert.ok(error instanceof GeideaRequestError);
        assert.equal(error.responseCode, "110");
        assert.equal(error.detailedResponseCode, "SIG-001");
        assert.equal(error.responseMessage, "Request rejected");
        assert.equal(error.detailedResponseMessage, "Invalid signature check merchant settings");
        assert.equal("session" in error, false);
        return true;
      },
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});