import crypto from "node:crypto";
import type { ISubscription } from "../mongodb/models";
import { getGeideaPublicAppUrl } from "./geideaService";

type InvoiceSubscription = Pick<ISubscription, "_id" | "userId" | "paidAt" | "approvedAt" | "createdAt">;

function invoiceAccessPayload(subscription: InvoiceSubscription): string | null {
  const id = String(subscription._id || "").trim();
  const userId = String(subscription.userId || "").trim();
  const issueDate = subscription.paidAt || subscription.approvedAt || subscription.createdAt;
  const parsedIssueDate = issueDate ? new Date(issueDate) : null;
  const timestamp = parsedIssueDate && Number.isFinite(parsedIssueDate.getTime())
    ? parsedIssueDate.toISOString()
    : "";
  if (!id || !userId || !timestamp) return null;
  return `${id}\n${userId}\n${timestamp}`;
}

export function createInvoiceAccessToken(subscription: InvoiceSubscription, secret = process.env.SESSION_SECRET): string | null {
  const payload = invoiceAccessPayload(subscription);
  if (!payload || !secret?.trim()) return null;
  return crypto.createHmac("sha256", secret.trim()).update(payload).digest("base64url");
}

export function verifyInvoiceAccessToken(
  subscription: InvoiceSubscription,
  token: unknown,
  secret = process.env.SESSION_SECRET,
): boolean {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const expectedToken = createInvoiceAccessToken(subscription, secret);
  if (!expectedToken) return false;
  const expected = Buffer.from(expectedToken, "base64url");
  const actual = Buffer.from(token, "base64url");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/** The signed capability stays in the URL fragment, outside HTTP requests and access logs. */
export function createSubscriptionInvoiceUrl(
  subscription: InvoiceSubscription,
  appOrigin?: string,
): string | null {
  const token = createInvoiceAccessToken(subscription);
  if (!token) return null;
  try {
    const url = new URL("/payment/geidea/invoice", appOrigin || getGeideaPublicAppUrl());
    url.searchParams.set("paymentId", String(subscription._id));
    url.hash = `access=${token}`;
    return url.toString();
  } catch {
    return null;
  }
}
