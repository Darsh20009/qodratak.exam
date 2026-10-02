import crypto from "crypto";

const GEIDEA_API_BASE_URL = "https://api.ksamerchant.geidea.net";
const GEIDEA_CHECKOUT_BASE_URL = "https://www.ksamerchant.geidea.net/hpp/checkout/";

type GeideaCredentials = {
  publicKey: string;
  apiPassword: string;
};

export class GeideaConfigurationError extends Error {
  constructor(message = "Geidea sandbox credentials are not configured") {
    super(message);
    this.name = "GeideaConfigurationError";
  }
}

type GeideaProviderErrorFields = {
  responseCode?: string;
  detailedResponseCode?: string;
  responseMessage?: string;
  detailedResponseMessage?: string;
};

function safeProviderCode(value: unknown): string | undefined {
  if (typeof value === "string") return value.slice(0, 32);
  if (typeof value === "number" && Number.isInteger(value)) return String(value).slice(0, 32);
  return undefined;
}

function safeProviderMessage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 256);
}

function providerErrorFields(payload: unknown): GeideaProviderErrorFields {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) return {};
  const response = payload as Record<string, unknown>;
  return {
    responseCode: safeProviderCode(response.responseCode),
    detailedResponseCode: safeProviderCode(response.detailedResponseCode),
    responseMessage: safeProviderMessage(response.responseMessage),
    detailedResponseMessage: safeProviderMessage(response.detailedResponseMessage),
  };
}

export class GeideaRequestError extends Error {
  readonly statusCode?: number;
  readonly responseCode?: string;
  readonly detailedResponseCode?: string;
  readonly responseMessage?: string;
  readonly detailedResponseMessage?: string;

  constructor(
    message: string,
    options: { statusCode?: number } & GeideaProviderErrorFields = {},
  ) {
    super(message);
    this.name = "GeideaRequestError";
    this.statusCode = options.statusCode;
    this.responseCode = options.responseCode;
    this.detailedResponseCode = options.detailedResponseCode;
    this.responseMessage = options.responseMessage;
    this.detailedResponseMessage = options.detailedResponseMessage;
  }
}

function getCredentials(): GeideaCredentials {
  if (process.env.GEIDEA_MODE && process.env.GEIDEA_MODE !== "sandbox") {
    throw new GeideaConfigurationError("Only the Geidea sandbox is enabled");
  }

  const publicKey = process.env.GEIDEA_TEST_PUBLIC_KEY?.trim();
  const apiPassword = process.env.GEIDEA_TEST_API_PASSWORD?.trim();
  if (!publicKey || !apiPassword) throw new GeideaConfigurationError();
  return { publicKey, apiPassword };
}

export function isGeideaSandboxConfigured(): boolean {
  return Boolean(
    process.env.GEIDEA_TEST_PUBLIC_KEY?.trim() &&
      process.env.GEIDEA_TEST_API_PASSWORD?.trim() &&
      (!process.env.GEIDEA_MODE || process.env.GEIDEA_MODE === "sandbox"),
  );
}

export function getGeideaPublicAppUrl(): string {
  const raw = process.env.GEIDEA_PUBLIC_APP_URL?.trim() || "https://qodratak.sa";
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new GeideaConfigurationError("The Geidea callback origin is invalid");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new GeideaConfigurationError("The Geidea callback origin must be a plain HTTPS origin");
  }
  return parsed.origin;
}

export function formatGeideaTimestamp(date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function amountString(amount: number): string {
  return amount.toFixed(2);
}

function hmacSignature(data: string, apiPassword: string): string {
  return crypto.createHmac("sha256", apiPassword).update(data, "utf8").digest("base64");
}

export function createSessionSignature(input: {
  publicKey: string;
  amount: number;
  currency: string;
  merchantReferenceId: string;
  timestamp: string;
  apiPassword: string;
}): string {
  return hmacSignature(
    `${input.publicKey}${amountString(input.amount)}${input.currency}${input.merchantReferenceId}${input.timestamp}`,
    input.apiPassword,
  );
}

export function createRefundSignature(input: {
  publicKey: string;
  refundAmount: number;
  orderId: string;
  timestamp: string;
  apiPassword: string;
}): string {
  return hmacSignature(
    `${input.timestamp}${input.publicKey}${amountString(input.refundAmount)}${input.orderId}`,
    input.apiPassword,
  );
}

function basicAuthorization(credentials: GeideaCredentials): string {
  return `Basic ${Buffer.from(`${credentials.publicKey}:${credentials.apiPassword}`).toString("base64")}`;
}

async function geideaJsonRequest<T>(
  path: string,
  init: RequestInit,
  credentials: GeideaCredentials,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${GEIDEA_API_BASE_URL}${path}`, {
      ...init,
      signal: AbortSignal.timeout(15_000),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: basicAuthorization(credentials),
        ...init.headers,
      },
    });
  } catch {
    throw new GeideaRequestError("Geidea sandbox could not be reached");
  }

  let payload: any;
  try {
    payload = await response.json();
  } catch {
    throw new GeideaRequestError("Geidea returned an unreadable response", {
      statusCode: response.status,
    });
  }

  if (!response.ok) {
    throw new GeideaRequestError("Geidea rejected the request", {
      statusCode: response.status,
      ...providerErrorFields(payload),
    });
  }
  return payload as T;
}

export async function createGeideaSession(input: {
  amount: number;
  merchantReferenceId: string;
  callbackUrl: string;
  returnUrl: string;
  customer: {
    email?: string;
    phoneNumber?: string;
    firstName?: string;
    lastName?: string;
  };
}): Promise<{ sessionId: string; checkoutUrl: string }> {
  const credentials = getCredentials();
  const timestamp = formatGeideaTimestamp();
  const signature = createSessionSignature({
    publicKey: credentials.publicKey,
    amount: input.amount,
    currency: "SAR",
    merchantReferenceId: input.merchantReferenceId,
    timestamp,
    apiPassword: credentials.apiPassword,
  });

  const payload = await geideaJsonRequest<any>(
    "/payment-intent/api/v2/direct/session",
    {
      method: "POST",
      body: JSON.stringify({
        amount: input.amount,
        currency: "SAR",
        merchantReferenceId: input.merchantReferenceId,
        timestamp,
        signature,
        callbackUrl: input.callbackUrl,
        returnUrl: input.returnUrl,
        paymentOperation: "Pay",
        cardOnFile: false,
        language: "ar",
        customer: input.customer,
      }),
    },
    credentials,
  );

  const session = payload?.session;
  if (
    payload?.responseCode !== "000" ||
    payload?.detailedResponseCode !== "000" ||
    typeof session?.id !== "string" ||
    !session.id
  ) {
    throw new GeideaRequestError("Geidea did not create a checkout session", {
      ...providerErrorFields(payload),
    });
  }

  return {
    sessionId: session.id,
    checkoutUrl: `${GEIDEA_CHECKOUT_BASE_URL}?${encodeURIComponent(session.id)}`,
  };
}

export async function fetchGeideaOrdersByMerchantReference(merchantReferenceId: string): Promise<any[]> {
  const credentials = getCredentials();
  const query = new URLSearchParams({ MerchantReferenceId: merchantReferenceId });
  const payload = await geideaJsonRequest<any>(
    `/pgw/api/v1/direct/order?${query.toString()}`,
    { method: "GET" },
    credentials,
  );

  if (
    payload?.responseCode &&
    (payload.responseCode !== "000" || payload.detailedResponseCode !== "000")
  ) {
    throw new GeideaRequestError("Geidea could not find the merchant order", {
      responseCode: String(payload.responseCode),
    });
  }

  return Array.isArray(payload?.orders) ? payload.orders : [];
}

export async function refundGeideaOrder(input: {
  orderId: string;
  amount: number;
  callbackUrl?: string;
}): Promise<{ refundedAmount: number; detailedStatus: string }> {
  const credentials = getCredentials();
  const timestamp = formatGeideaTimestamp();
  const signature = createRefundSignature({
    publicKey: credentials.publicKey,
    refundAmount: input.amount,
    orderId: input.orderId,
    timestamp,
    apiPassword: credentials.apiPassword,
  });
  const payload = await geideaJsonRequest<any>(
    "/pgw/api/v2/direct/refund",
    {
      method: "POST",
      body: JSON.stringify({
        orderId: input.orderId,
        refundAmount: input.amount,
        timestamp,
        signature,
        ...(input.callbackUrl ? { callbackUrl: input.callbackUrl } : {}),
      }),
    },
    credentials,
  );
  const order = payload?.order;
  const refundedAmount = Number(order?.totalRefundedAmount);
  if (
    payload?.responseCode !== "000" ||
    payload?.detailedResponseCode !== "000" ||
    order?.status !== "Success" ||
    !Number.isFinite(refundedAmount)
  ) {
    throw new GeideaRequestError("Geidea did not confirm the refund", {
      responseCode: typeof payload?.responseCode === "string" ? payload.responseCode : undefined,
    });
  }
  return {
    refundedAmount,
    detailedStatus: String(order.detailedStatus || "Refunded"),
  };
}

export function verifyGeideaCallbackSignature(input: {
  publicKey: string;
  amount: number;
  currency: string;
  orderId: string;
  status: string;
  merchantReferenceId: string;
  timestamp: string;
  signature: string;
  apiPassword: string;
}): boolean {
  const expected = hmacSignature(
    `${input.publicKey}${amountString(input.amount)}${input.currency}${input.orderId}${input.status}${input.merchantReferenceId}${input.timestamp}`,
    input.apiPassword,
  );
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(input.signature);
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function getGeideaCallbackPublicKey(): string {
  return getCredentials().publicKey;
}

export function verifyGeideaCallbackPayload(input: {
  amount: number;
  currency: string;
  orderId: string;
  status: string;
  merchantReferenceId: string;
  timestamp: string;
  signature: string;
}): boolean {
  const credentials = getCredentials();
  return verifyGeideaCallbackSignature({
    ...input,
    publicKey: credentials.publicKey,
    apiPassword: credentials.apiPassword,
  });
}

export function geideaPaymentIsSuccessful(order: any, expected: {
  merchantReferenceId: string;
  amount: number;
}): boolean {
  return (
    String(order?.merchantReferenceId || "") === expected.merchantReferenceId &&
    String(order?.currency || "").toUpperCase() === "SAR" &&
    Number(order?.amount).toFixed(2) === amountString(expected.amount) &&
    String(order?.status || "").toLowerCase() === "success" &&
    ["paid", "captured", "settled"].includes(String(order?.detailedStatus || "").toLowerCase())
  );
}

export function geideaPaymentIsFailed(order: any): boolean {
  const status = String(order?.status || "").toLowerCase();
  const detailedStatus = String(order?.detailedStatus || "").toLowerCase();
  return status === "failed" || ["orderfailed", "failed", "cancelled", "canceled"].includes(detailedStatus);
}