import { InAppNotification, TestResult, User } from "../mongodb/models";
import { sendWhatsAppText } from "./whatsappService";

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAILY_BATCH_LIMIT = 2000;

function riyadhNow() {
  return new Date(Date.now() + RIYADH_OFFSET_MS);
}

function fromRiyadhDate(date: Date) {
  return new Date(date.getTime() - RIYADH_OFFSET_MS);
}

function startOfRiyadhDay(date = riyadhNow()) {
  return fromRiyadhDate(
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())),
  );
}

function normalizePhone(value: unknown) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("05") && digits.length === 10) digits = `966${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) digits = `966${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : "";
}

function userPhone(user: any) {
  return normalizePhone(user?.whatsappPhone || user?.phone);
}

function displayName(user: any) {
  return user?.fullName || user?.username || "الطالب";
}

export async function sendStudentWhatsAppNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    link?: string;
    type?: string;
    createInApp?: boolean;
  },
) {
  let user: any = null;
  try {
    user = await User.findById(userId);
  } catch {
    // Some legacy subscriptions contain the numeric/file-storage user id.
  }
  if (!user) {
    user = await User.findOne({
      $or: [
        { username: String(userId) },
        { email: String(userId).toLowerCase() },
        { legacyId: String(userId) },
      ],
    });
  }
  if (!user || user.notifWhatsApp === false) return { sent: false, reason: "disabled" };

  if (notification.createInApp !== false) {
    await InAppNotification.create({
      userId: String(user._id),
      title: notification.title,
      body: notification.body,
      type: (notification.type || "info") as "info" | "success" | "warning" | "exam" | "achievement" | "event" | "promo",
      link: notification.link,
      isGlobal: false,
      sentBy: "system",
      isRead: false,
    });
  }

  const phone = userPhone(user);
  if (!phone) return { sent: false, reason: "missing_phone" };

  await sendWhatsAppText(phone, `${notification.title}\n\n${notification.body}`);
  return { sent: true };
}

function dailyMessage(user: any, results: any[]) {
  const completedTests = results.length;
  const track = user?.academicTrack || user?.studyGoal || "المسار الذي اخترته";
  const daysSinceVisit = user?.lastVisit
    ? Math.floor((Date.now() - new Date(user.lastVisit).getTime()) / (24 * 60 * 60 * 1000))
    : 0;
  const greeting = daysSinceVisit >= 2
    ? "اشتقنا لك، خذ خطوة صغيرة اليوم وستعود لروتينك بسرعة."
    : "نحن معك خطوة بخطوة ونفرح بكل تقدم تحققه.";
  const focus = completedTests > 0
    ? "راجع أخطاء آخر اختبار ثم حل 10 أسئلة جديدة."
    : "ابدأ بـ 10 أسئلة تأسيسية بسيطة لتسخين مستواك.";

  return {
    title: "ابدأ اليوم مع قدراتك 🌤️",
    body: [
      `مرحباً ${displayName(user)}، ${greeting}`,
      "",
      "هذه خطتك لليوم:",
      `1) المسار: ${track}`,
      `2) ${focus}`,
      "3) اختم بجلسة قصيرة وسجّل تقدمك.",
      "",
      "حتى 20 دقيقة اليوم تصنع فرقاً. افتح المنصة وابدأ الآن 💪",
    ].join("\n"),
  };
}

export async function sendDailyStudentFollowUps() {
  const todayStart = startOfRiyadhDay();
  const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const users = await User.find({
    role: "student",
    isActive: { $ne: false },
    notifWhatsApp: { $ne: false },
    $or: [{ phone: { $exists: true, $ne: "" } }, { whatsappPhone: { $exists: true, $ne: "" } }],
    $and: [
      {
        $or: [
          { whatsappDailyFollowUpLastSent: { $lt: todayStart } },
          { whatsappDailyFollowUpLastSent: { $exists: false } },
        ],
      },
    ],
  })
    .select("_id fullName username phone whatsappPhone academicTrack studyGoal lastVisit notifWhatsApp whatsappDailyFollowUpLastSent")
    .limit(DAILY_BATCH_LIMIT);

  let sent = 0;
  let skipped = 0;
  for (const user of users) {
    const sentAt = new Date();
    try {
      const claimed = await User.findOneAndUpdate(
        {
          _id: user._id,
          $or: [
            { whatsappDailyFollowUpLastSent: { $lt: todayStart } },
            { whatsappDailyFollowUpLastSent: { $exists: false } },
          ],
        },
        { $set: { whatsappDailyFollowUpLastSent: sentAt } },
        { new: true },
      );
      if (!claimed) {
        skipped++;
        continue;
      }

      const results = await TestResult.find({
        userId: String(user._id),
        createdAt: { $gte: weekAgo, $lt: new Date() },
      }).select("score totalScore totalQuestions correctAnswers").lean();
      const message = dailyMessage(user, results);
      const phone = userPhone(user);
      if (!phone) {
        skipped++;
        continue;
      }

      await sendWhatsAppText(phone, `${message.title}\n\n${message.body}`);
      await InAppNotification.create({
        userId: String(user._id),
        title: message.title,
        body: message.body,
        type: "info",
        link: "/ai-hub/daily-plan",
        isGlobal: false,
        sentBy: "system",
        isRead: false,
      });
      sent++;
    } catch (error) {
      await User.updateOne(
        { _id: user._id, whatsappDailyFollowUpLastSent: sentAt },
        { $unset: { whatsappDailyFollowUpLastSent: 1 } },
      ).catch(() => undefined);
      skipped++;
      console.error(`Daily WhatsApp follow-up failed for ${user._id}:`, error);
    }
  }

  return { sent, skipped, total: users.length };
}