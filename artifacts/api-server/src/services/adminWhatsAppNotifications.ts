import {
  Expense,
  PlatformSetting,
  Subscription,
  TestResult,
  User,
} from "../mongodb/models";
import { sendWhatsAppText } from "./whatsappService";
import { sendStudentWhatsAppNotification } from "./studentWhatsAppNotifications";

const adminPhone = (
  process.env.ADMIN_WHATSAPP_PHONE || "966555053567"
).replace(/\D/g, "");
const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

type ReportPeriod = "daily" | "weekly" | "monthly";

function riyadhNow() {
  return new Date(Date.now() + RIYADH_OFFSET_MS);
}

function fromRiyadhDate(date: Date) {
  return new Date(date.getTime() - RIYADH_OFFSET_MS);
}

function startOfRiyadhDay(date = riyadhNow()) {
  return fromRiyadhDate(
    new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    ),
  );
}

function reportWindow(period: ReportPeriod) {
  const end = new Date();
  const local = riyadhNow();
  if (period === "daily") {
    return { start: startOfRiyadhDay(local), end };
  }
  if (period === "weekly") {
    const start = startOfRiyadhDay(local);
    start.setUTCDate(start.getUTCDate() - 6);
    return { start, end };
  }
  return {
    start: fromRiyadhDate(
      new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1)),
    ),
    end,
  };
}

function reportKey(period: ReportPeriod, date = riyadhNow()) {
  const day = date.toISOString().slice(0, 10);
  return `admin_whatsapp_${period}_${day}`;
}

export async function notifyAdminNewStudent(student: {
  fullName?: string;
  username?: string;
  phone?: string;
  role?: string;
}) {
  if (student.role !== "student") return;
  await sendWhatsAppText(
    adminPhone,
    [
      "🎓 تسجيل طالب جديد",
      `الاسم: ${student.fullName || "غير محدد"}`,
      `اسم المستخدم: ${student.username || "غير محدد"}`,
      `الجوال: ${student.phone || "غير محدد"}`,
      `الوقت: ${new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}`,
    ].join("\n"),
    "admin_new_student",
  );
}

export async function notifyAdminSubscription(subscription: {
  studentName?: string;
  plan: string;
  price?: number;
  paymentMethod?: string;
  status: "pending" | "active";
}) {
  await sendWhatsAppText(
    adminPhone,
    [
      subscription.status === "active"
        ? "✅ تم تفعيل اشتراك طالب"
        : "🧾 طلب اشتراك طالب جديد",
      `الطالب: ${subscription.studentName || "غير محدد"}`,
      `الخطة: ${subscription.plan}`,
      `المبلغ: ${Number(subscription.price || 0).toLocaleString("ar-SA")} ر.س`,
      `طريقة الدفع: ${subscription.paymentMethod || "غير محددة"}`,
      `الحالة: ${subscription.status === "active" ? "مفعّل" : "بانتظار المراجعة"}`,
    ].join("\n"),
    "admin_subscription",
  );
}

function normalizeCampaignPhone(value: unknown) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("05") && digits.length === 10) digits = `966${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) digits = `966${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : "";
}

export type WhatsAppCampaignTarget = "all" | "subscribed" | "free";

export async function sendWhatsAppCampaign(input: {
  title: string;
  body: string;
  target: WhatsAppCampaignTarget;
}) {
  void input;
  throw new Error("WHATSAPP_CAMPAIGNS_DISABLED");
}

export async function notifyStudentSubscriptionActivated(input: {
  userId: string;
  plan: string;
  price?: number;
  endDate?: Date | string;
}) {
  const endDate = input.endDate ? new Date(input.endDate) : null;
  const endDateLabel = endDate && !Number.isNaN(endDate.getTime())
    ? endDate.toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh" })
    : "غير محدد";

  return sendStudentWhatsAppNotification(input.userId, {
    title: "تم تفعيل اشتراكك ✅",
    body: [
      "أهلاً بك في رحلتك التعليمية مع قدراتك.",
      `الخطة: ${input.plan}`,
      `المبلغ: ${Number(input.price || 0).toLocaleString("ar-SA")} ر.س`,
      `ينتهي الاشتراك في: ${endDateLabel}`,
      "",
      "افتح المنصة وابدأ خطتك اليوم. نحن نتابع تقدمك معك خطوة بخطوة.",
    ].join("\n"),
    link: "/",
    type: "success",
    whatsappKind: "customer_purchase",
  });
}

export async function sendAdminFinancialReport(period: ReportPeriod) {
  const { start, end } = reportWindow(period);
  const [newStudents, tests, activeSubscriptions, subscriptions, expenses] =
    await Promise.all([
      User.countDocuments({ role: "student", createdAt: { $gte: start, $lte: end } }),
      TestResult.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Subscription.countDocuments({ status: "active", endDate: { $gte: end } }),
      Subscription.find({
        status: "active",
        $or: [
          { approvedAt: { $gte: start, $lte: end } },
          { approvedAt: { $exists: false }, createdAt: { $gte: start, $lte: end } },
        ],
      }).select("price"),
      Expense.find({ date: { $gte: start, $lte: end } }).select("amount"),
    ]);

  const revenue = subscriptions.reduce(
    (total, item) => total + Number(item.price || 0),
    0,
  );
  const expenseTotal = expenses.reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  );
  const periodLabels = {
    daily: "اليومية",
    weekly: "الأسبوعية",
    monthly: "الشهرية",
  };

  await sendWhatsAppText(
    adminPhone,
    [
      `📊 النظرة المالية ${periodLabels[period]}`,
      `من: ${start.toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}`,
      `إلى: ${end.toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}`,
      "",
      `طلاب جدد: ${newStudents}`,
      `اشتراكات جديدة مفعلة: ${subscriptions.length}`,
      `إجمالي الاشتراكات النشطة: ${activeSubscriptions}`,
      `اختبارات منفذة: ${tests}`,
      `الإيرادات: ${revenue.toLocaleString("ar-SA")} ر.س`,
      `المصروفات: ${expenseTotal.toLocaleString("ar-SA")} ر.س`,
      `الصافي: ${(revenue - expenseTotal).toLocaleString("ar-SA")} ر.س`,
    ].join("\n"),
    "admin_daily_report",
  );
}

async function sendOnce(period: ReportPeriod) {
  const key = reportKey(period);
  const existing = await PlatformSetting.exists({ key });
  if (existing) return;
  await sendAdminFinancialReport(period);
  await PlatformSetting.create({
    key,
    value: { sentAt: new Date(), period },
    label: `Admin WhatsApp ${period} report`,
    type: "json",
    category: "notifications",
    updatedBy: "system",
  });
}

async function checkScheduledAdminReports() {
  const now = riyadhNow();
  const hour = now.getUTCHours();
  if (hour < 21) return;

  await sendOnce("daily");
}

export function startAdminWhatsAppReportScheduler() {
  setTimeout(() => void checkScheduledAdminReports().catch(console.error), 60_000);
  setInterval(
    () => void checkScheduledAdminReports().catch(console.error),
    15 * 60 * 1000,
  );
}