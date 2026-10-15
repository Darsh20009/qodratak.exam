import assert from "node:assert/strict";
import crypto from "node:crypto";
import test, { beforeEach, afterEach } from "node:test";
import {
  createGeideaSession,
  createSessionSignature,
  GeideaRequestError,
  GeideaConfigurationError,
  getGeideaMode,
  isGeideaConfigured,
  verifyGeideaCallbackPayload,
  geideaPaymentIsSuccessful,
  verifyGeideaCallbackSignature,
} from "../src/services/geideaService";

const credentialKeys = [
  "GEIDEA_MODE", "GEIDEA_TEST_PUBLIC_KEY", "GEIDEA_TEST_API_PASSWORD",
  "GEIDEA_LIVE_PUBLIC_KEY", "GEIDEA_LIVE_API_PASSWORD",
] as const;
let savedEnv: Array<[string, string | undefined]> = [];
beforeEach(() => {
  savedEnv = credentialKeys.map((key) => [key, process.env[key]]);
  for (const key of credentialKeys) delete process.env[key];
});
afterEach(() => {
  for (const [key, value] of savedEnv) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("Geidea defaults to sandbox and requires a complete pair for the explicit mode", () => {
  assert.equal(getGeideaMode(), "sandbox");
  assert.equal(isGeideaConfigured(), false);
  process.env.GEIDEA_TEST_PUBLIC_KEY = "test-public";
  process.env.GEIDEA_TEST_API_PASSWORD = "test-password";
  assert.equal(isGeideaConfigured(), true);
  process.env.GEIDEA_MODE = "live";
  assert.equal(isGeideaConfigured(), false);
  process.env.GEIDEA_LIVE_PUBLIC_KEY = "live-public";
  assert.equal(isGeideaConfigured(), false);
  process.env.GEIDEA_LIVE_API_PASSWORD = "live-password";
  assert.equal(isGeideaConfigured(), true);
  process.env.GEIDEA_MODE = "invalid";
  assert.equal(isGeideaConfigured(), false);
  assert.throws(() => getGeideaMode(), GeideaConfigurationError);
});

test("production requires an explicit Geidea mode instead of silently using sandbox", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    assert.throws(() => getGeideaMode(), GeideaConfigurationError);
    process.env.GEIDEA_MODE = "live";
    assert.equal(getGeideaMode(), "live");
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test("Geidea live sessions and callbacks use only the live credential pair", async () => {
  process.env.GEIDEA_MODE = "live";
  process.env.GEIDEA_TEST_PUBLIC_KEY = "test-public";
  process.env.GEIDEA_TEST_API_PASSWORD = "test-password";
  process.env.GEIDEA_LIVE_PUBLIC_KEY = "live-public";
  process.env.GEIDEA_LIVE_API_PASSWORD = "live-password";
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(new Headers(init?.headers).get("authorization"),
      `Basic ${Buffer.from("live-public:live-password").toString("base64")}`);
    const body = JSON.parse(String(init?.body));
    assert.equal(body.signature, createSessionSignature({
      ...body, publicKey: "live-public", apiPassword: "live-password",
    }));
    return new Response(JSON.stringify({
      responseCode: "000", detailedResponseCode: "000", session: { id: "live-session" },
    }), { status: 200 });
  }) as typeof fetch;
  try {
    const result = await createGeideaSession({
      amount: 10, merchantReferenceId: "live-reference",
      callbackUrl: "https://example.test/callback",
      returnUrl: "https://example.test/return", customer: {},
    });
    assert.equal(result.sessionId, "live-session");
    const input = {
      amount: 10, currency: "SAR", orderId: "live-order", status: "Success",
      merchantReferenceId: "live-reference", timestamp: "2026/10/12 12:30:45",
    };
    const data = `live-public10.00SARlive-orderSuccesslive-reference${input.timestamp}`;
    const signature = crypto.createHmac("sha256", "live-password").update(data).digest("base64");
    assert.equal(verifyGeideaCallbackPayload({ ...input, signature }), true);
    assert.equal(verifyGeideaCallbackPayload({ ...input, amount: 11, signature }), false);
    assert.equal(verifyGeideaCallbackPayload({
      ...input, signature: crypto.createHmac("sha256", "test-password").update(data).digest("base64"),
    }), false);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

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
  process.env.GEIDEA_TEST_PUBLIC_KEY = "unit-test-public";
  process.env.GEIDEA_TEST_API_PASSWORD = "unit-test-password";

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
        customer: {},
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