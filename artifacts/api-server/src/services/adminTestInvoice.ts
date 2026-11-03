export function normalizeAdminTestInvoicePhone(value: unknown): string | null {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("05") && digits.length === 10) digits = `966${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) digits = `966${digits}`;
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

export function buildAdminTestInvoiceMessage(reference: string, issuedAt = new Date()): string {
  const safeReference = reference.replace(/[^A-Za-z0-9-]/g, "").slice(0, 48);
  const issueDate = issuedAt.toLocaleDateString("ar-SA-u-ca-gregory", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  });
  return [
    "🧾 فاتورة تجريبية — غير مدفوعة",
    `رقم النموذج: ${safeReference}`,
    `تاريخ النموذج: ${issueDate}`,
    "العميل: نموذج اختبار",
    "البند: اختبار إرسال فاتورة واتساب",
    "الإجمالي: 0.00 ر.س",
    "الحالة: تجريبية — غير مدفوعة",
    "",
    "هذه رسالة اختبار فقط؛ لا تمثل عملية دفع أو اشتراكًا أو مبلغًا مستحقًا.",
  ].join("\n");
}
