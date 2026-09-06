import crypto from "crypto";
import { sendWhatsAppText } from "./whatsappService";

export type OtpPurpose = "signup" | "login" | "parent_signup" | "link_child";

interface OtpRecord {
  digest: string;
  expiresAt: number;
  attemptsLeft: number;
  sentAt: number;
}

const OTP_TTL_MS = 30 * 60 * 1000;
const RESEND_WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_WINDOW = 5;
const REQUEST_LIMIT_WINDOW_MS = 30 * 60 * 1000;
const otpStore = new Map<string, OtpRecord>();
const otpRequestHistory = new Map<string, number[]>();

function secret() {
  return process.env.SESSION_SECRET || "qudratak-development-session";
}

function digest(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

function recordKey(phone: string, purpose: OtpPurpose) {
  return `${purpose}:${phone}`;
}

export function normalizeSaudiPhone(value: unknown) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("05")) digits = `966${digits.slice(1)}`;
  else if (digits.startsWith("5") && digits.length === 9) digits = `966${digits}`;
  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    throw new Error("INVALID_PHONE");
  }
  return digits;
}

export async function requestPhoneOtp(phoneInput: unknown, purpose: OtpPurpose) {
  const phone = normalizeSaudiPhone(phoneInput);
  const key = recordKey(phone, purpose);
  const existing = otpStore.get(key);
  const now = Date.now();
  const recentRequests = (otpRequestHistory.get(phone) || []).filter(
    (requestedAt) => now - requestedAt < REQUEST_LIMIT_WINDOW_MS,
  );
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil(
      (REQUEST_LIMIT_WINDOW_MS - (now - recentRequests[0])) / 1000,
    );
    return { phone, retryAfter, sent: false as const };
  }
  if (existing && now - existing.sentAt < RESEND_WINDOW_MS) {
    const retryAfter = Math.ceil((RESEND_WINDOW_MS - (now - existing.sentAt)) / 1000);
    return { phone, retryAfter, sent: false as const };
  }

  const otp = crypto.randomInt(100000, 1_000_000).toString();
  await sendWhatsAppText(
    phone,
    `رمز التحقق في منصة قدراتك هو: ${otp}\nصالح لمدة 30 دقيقة. لا تشارك هذا الرمز مع أي شخص. لن يطلب منك فريق قدراتك إرسال الرمز لهم.`,
    "otp",
  );
  otpRequestHistory.set(phone, [...recentRequests, now]);
  otpStore.set(key, {
    digest: digest(`${key}:${otp}`),
    expiresAt: now + OTP_TTL_MS,
    attemptsLeft: MAX_ATTEMPTS,
    sentAt: now,
  });
  return { phone, retryAfter: 60, sent: true as const };
}

export function verifyPhoneOtp(phoneInput: unknown, otpInput: unknown, purpose: OtpPurpose) {
  const phone = normalizeSaudiPhone(phoneInput);
  const key = recordKey(phone, purpose);
  const record = otpStore.get(key);
  if (!record || record.expiresAt < Date.now()) {
    otpStore.delete(key);
    throw new Error("OTP_EXPIRED");
  }
  if (record.attemptsLeft <= 0) {
    otpStore.delete(key);
    throw new Error("OTP_ATTEMPTS_EXCEEDED");
  }

  const actual = Buffer.from(record.digest, "hex");
  const candidate = Buffer.from(digest(`${key}:${String(otpInput || "").trim()}`), "hex");
  const valid = actual.length === candidate.length && crypto.timingSafeEqual(actual, candidate);
  if (!valid) {
    record.attemptsLeft -= 1;
    throw new Error("OTP_INVALID");
  }

  otpStore.delete(key);
  return {
    phone,
    verificationToken: createPhoneVerificationToken(phone, purpose),
  };
}

function createPhoneVerificationToken(phone: string, purpose: OtpPurpose) {
  const payload = Buffer.from(
    JSON.stringify({ phone, purpose, exp: Date.now() + OTP_TTL_MS }),
  ).toString("base64url");
  const signature = digest(`phone-ticket:${payload}`);
  return `${payload}.${signature}`;
}

export function verifyPhoneVerificationToken(
  token: unknown,
  expectedPhone: unknown,
  purpose: OtpPurpose,
) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return false;
  const actual = Buffer.from(signature, "hex");
  const expected = Buffer.from(digest(`phone-ticket:${payload}`), "hex");
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return (
      data.phone === normalizeSaudiPhone(expectedPhone) &&
      data.purpose === purpose &&
      Number(data.exp) > Date.now()
    );
  } catch {
    return false;
  }
}