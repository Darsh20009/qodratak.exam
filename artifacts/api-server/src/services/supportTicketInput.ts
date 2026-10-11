import { createHash } from "node:crypto";

export class SupportTicketInputError extends Error {}

export function normalizeSupportPhone(value: string) {
  const latin = value.replace(/[٠-٩۰-۹]/g, (char) => String(
    char.charCodeAt(0) >= 0x06f0 ? char.charCodeAt(0) - 0x06f0 : char.charCodeAt(0) - 0x0660,
  ));
  if (!/^[+\d\s().-]+$/.test(latin)) return "";
  let digits = latin.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^05\d{8}$/.test(digits)) digits = `966${digits.slice(1)}`;
  if (/^5\d{8}$/.test(digits)) digits = `966${digits}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : "";
}

export function validateSupportTicketInput(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new SupportTicketInputError("بيانات التذكرة غير صالحة.");
  const body = raw as Record<string, unknown>;
  const text = (key: string) => typeof body[key] === "string" ? String(body[key]).trim() : "";
  const userName = text("userName").replace(/\s+/g, " ");
  const userEmail = text("userEmail").toLowerCase();
  const userPhone = normalizeSupportPhone(text("userPhone"));
  const message = text("message");
  const requestId = text("requestId");
  if (text("website")) throw new SupportTicketInputError("تعذر إرسال التذكرة.");
  if (userName.length < 2 || userName.length > 100) throw new SupportTicketInputError("أدخل اسمًا بين 2 و100 حرف.");
  if (userEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) throw new SupportTicketInputError("أدخل بريدًا إلكترونيًا صحيحًا.");
  if (!userPhone || text("userPhone").length > 30) throw new SupportTicketInputError("أدخل رقم جوال صحيحًا.");
  if (message.length < 10 || message.length > 4000) throw new SupportTicketInputError("اكتب الشكوى بين 10 و4000 حرف.");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    throw new SupportTicketInputError("تعذر التحقق من الطلب. حدّث الصفحة وحاول مجددًا.");
  }
  const requestFingerprint = createHash("sha256").update(JSON.stringify({ userName, userEmail, userPhone, message })).digest("hex");
  return { userName, userEmail, userPhone, message, requestId, requestFingerprint };
}

export function supportTicketReference(id: unknown) {
  return `SUP-${String(id).toUpperCase()}`;
}
