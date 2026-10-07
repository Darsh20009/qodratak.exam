import { createHash } from "node:crypto";
import { logger } from "../lib/logger";
import { sendWhatsAppText } from "./whatsappService";

type TechnicalErrorAlert = {
  source: "api" | "browser";
  method?: string;
  path?: string;
  statusCode?: number;
  errorName?: string;
  message?: string;
  requestId?: string;
};

const recentAlerts = new Map<string, number>();
const clientReportWindows = new Map<string, { startedAt: number; count: number }>();
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

function normalizeAlertPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("05") && digits.length === 10) digits = `966${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) digits = `966${digits}`;
  return digits;
}

function safeMessage(value: unknown) {
  return String(value || "")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "[credential]")
    .replace(/\b(?:sk|rk|pk)-[A-Za-z0-9_-]{12,}\b/gi, "[credential]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/(?:\+?966|0)?5\d{8}/g, "[phone]")
    .replace(/(?:password|token|secret|authorization)\s*[:=]\s*\S+/gi, "[private value]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function safePath(value: unknown) {
  const raw = String(value || "/").split("?")[0].split("#")[0];
  return raw
    .replace(/\/[0-9a-f]{24}(?=\/|$)/gi, "/:id")
    .replace(/\/\d+(?=\/|$)/g, "/:id")
    .replace(/\/[^/]*@[^/]*(?=\/|$)/g, "/:value")
    .slice(0, 140);
}

function cleanOldEntries(now: number) {
  for (const [key, sentAt] of recentAlerts) {
    if (now - sentAt > DEDUPE_WINDOW_MS) recentAlerts.delete(key);
  }
  if (recentAlerts.size > 2000) {
    const oldest = [...recentAlerts.entries()]
      .sort((left, right) => left[1] - right[1])
      .slice(0, recentAlerts.size - 1500);
    oldest.forEach(([key]) => recentAlerts.delete(key));
  }
}

export function allowClientTechnicalReport(clientAddress: string) {
  const now = Date.now();
  const key = createHash("sha256").update(clientAddress || "unknown").digest("hex");
  const current = clientReportWindows.get(key);
  if (!current || now - current.startedAt >= 60_000) {
    clientReportWindows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= 3) return false;
  current.count += 1;
  return true;
}

export async function notifyTechnicalFailure(input: TechnicalErrorAlert) {
  const phone = normalizeAlertPhone(process.env.ADMIN_TECH_ERROR_PHONE || "");
  if (!phone) {
    logger.warn("Technical error alert skipped: ADMIN_TECH_ERROR_PHONE is not configured");
    return false;
  }

  const path = safePath(input.path);
  const errorName = safeMessage(input.errorName || "ApplicationError") || "ApplicationError";
  const message = safeMessage(input.message);
  const statusCode = Number.isInteger(input.statusCode) ? input.statusCode : undefined;
  const key = createHash("sha256")
    .update([
      input.source,
      input.method || "",
      path,
      statusCode || "",
      errorName,
      message,
    ].join("|"))
    .digest("hex");
  const now = Date.now();
  cleanOldEntries(now);
  const lastSentAt = recentAlerts.get(key);
  if (lastSentAt && now - lastSentAt < DEDUPE_WINDOW_MS) return false;
  recentAlerts.set(key, now);

  const details = [
    input.source === "api" ? "عطل تقني في الخادم" : "عطل تقني في واجهة الطالب",
    statusCode ? `الرمز: ${statusCode}` : "",
    input.method ? `الطلب: ${input.method.toUpperCase()} ${path}` : `المسار: ${path}`,
    `النوع: ${errorName}`,
    message ? `تفاصيل آمنة: ${message}` : "",
    input.requestId ? `معرّف التتبع: ${safeMessage(input.requestId)}` : "",
    `الوقت: ${new Date(now).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}`,
  ].filter(Boolean).join("\n");

  try {
    await sendWhatsAppText(phone, details, "admin_technical_error");
    return true;
  } catch (error) {
    recentAlerts.delete(key);
    logger.error(
      { errorName: error instanceof Error ? error.name : "UnknownError" },
      "Unable to deliver technical-error WhatsApp alert",
    );
    return false;
  }
}
