import webpush from 'web-push';
import { PushSubscription, User, ExamBooking, TestResult } from '../mongodb/models';

// ── VAPID setup ──────────────────────────────────────────────────────────────
const VAPID_EMAIL   = process.env.VAPID_EMAIL   || 'mailto:admin@qodratak.sa';
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
} else {
  console.warn('[Push] VAPID keys not configured — push notifications disabled');
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  type?: string;
  actions?: Array<{ action: string; title: string }>;
  data?: Record<string, any>;
}

// ── Core send helper ─────────────────────────────────────────────────────────
async function sendToSubscription(sub: any, payload: PushPayload): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/qodratak-logo.png',
        badge: payload.badge || '/qodratak-logo.png',
        tag: payload.tag || 'qodratak-default',
        url: payload.url || '/',
        type: payload.type || 'general',
        actions: payload.actions || [],
        data: payload.data || {},
      }),
      { TTL: 86400 }
    );
    return true;
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await PushSubscription.deleteOne({ _id: sub._id });
    }
    return false;
  }
}

// ── Send to a single user ────────────────────────────────────────────────────
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const subs = await PushSubscription.find({ userId });
  let sent = 0;
  for (const sub of subs) {
    if (await sendToSubscription(sub, payload)) sent++;
  }
  return sent;
}

// ── Send to all subscribed users ─────────────────────────────────────────────
export async function sendPushToAll(payload: PushPayload): Promise<number> {
  const subs = await PushSubscription.find({});
  let sent = 0;
  for (const sub of subs) {
    if (await sendToSubscription(sub, payload)) sent++;
  }
  return sent;
}

// ── Exam reminders — 24h and 1h before ──────────────────────────────────────
export async function sendPushExamReminders(): Promise<void> {
  try {
    const now = new Date();

    // 1-hour window (55-65 min ahead)
    const win1Start = new Date(now.getTime() + 55 * 60 * 1000);
    const win1End   = new Date(now.getTime() + 65 * 60 * 1000);

    // 24-hour window (23h55m – 24h05m ahead)
    const win24Start = new Date(now.getTime() + 23 * 60 * 60 * 1000 + 55 * 60 * 1000);
    const win24End   = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 5  * 60 * 1000);

    const [bookings1h, bookings24h] = await Promise.all([
      ExamBooking.find({
        status: 'pending',
        pushReminder1hSent: { $ne: true },
        scheduledAt: { $gte: win1Start, $lte: win1End },
      }),
      ExamBooking.find({
        status: 'pending',
        pushReminder24hSent: { $ne: true },
        scheduledAt: { $gte: win24Start, $lte: win24End },
      }),
    ]);

    for (const booking of bookings1h) {
      const timeStr = new Date(booking.scheduledAt).toLocaleTimeString('ar-SA', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Riyadh',
      });
      const sent = await sendPushToUser(String(booking.userId), {
        title: '⏰ اختبارك بعد ساعة!',
        body: `موعدك في ${timeStr}. تأكد من الاتصال ومكانك الهادئ 🎯`,
        tag: `exam-1h-${booking._id}`,
        url: '/book-exam',
        type: 'exam-reminder',
        actions: [
          { action: 'open', title: '📋 عرض الاختبار' },
          { action: 'dismiss', title: 'تجاهل' },
        ],
      });
      if (sent > 0) {
        await ExamBooking.updateOne({ _id: booking._id }, { pushReminder1hSent: true });
        console.log(`🔔 Push 1h exam reminder → user ${booking.userId}`);
      }
    }

    for (const booking of bookings24h) {
      const dateStr = new Date(booking.scheduledAt).toLocaleDateString('ar-SA', {
        weekday: 'long', timeZone: 'Asia/Riyadh',
      });
      const sent = await sendPushToUser(String(booking.userId), {
        title: '📅 اختبارك غداً!',
        body: `اختبارك القياس يوم ${dateStr}. راجع نقاط ضعفك الليلة 💪`,
        tag: `exam-24h-${booking._id}`,
        url: '/book-exam',
        type: 'exam-reminder',
        actions: [
          { action: 'open', title: '📋 عرض الاختبار' },
          { action: 'strategy', title: '📚 مكتبة الاستراتيجيات' },
        ],
      });
      if (sent > 0) {
        await ExamBooking.updateOne({ _id: booking._id }, { pushReminder24hSent: true });
        console.log(`🔔 Push 24h exam reminder → user ${booking.userId}`);
      }
    }
  } catch (err) {
    console.error('sendPushExamReminders error:', err);
  }
}

// ── Daily study reminder — every day 7AM KSA (4AM UTC) ──────────────────────
export async function sendDailyStudyReminder(): Promise<void> {
  try {
    const messages = [
      { title: '☀️ صباح الخير!', body: 'ابدأ يومك بـ 10 أسئلة من بنك الأسئلة 💪' },
      { title: '🎯 يوم جديد، هدف جديد!', body: 'حل أسئلة اليوم وحافظ على سلسلتك 🔥' },
      { title: '🧠 دماغك جاهز؟', body: 'تحدّ نفسك بـ 15 سؤال الآن وشوف كم تحصّل' },
      { title: '📈 استمر في التقدم!', body: 'كل سؤال تحلّه يقرّبك من الدرجة اللي تحلم فيها' },
      { title: '⚡ نشاطك اليومي ينتظرك!', body: 'لا تكسر سلسلة نجاحك — افتح المنصة الآن' },
    ];
    const pick = messages[new Date().getDay() % messages.length];

    await sendPushToAll({
      title: pick.title,
      body: pick.body,
      tag: 'daily-study',
      url: '/question-bank',
      type: 'daily-study',
      actions: [
        { action: 'open', title: '📝 ابدأ الآن' },
        { action: 'dismiss', title: 'لاحقاً' },
      ],
    });
    console.log('🔔 Daily study push sent');
  } catch (err) {
    console.error('sendDailyStudyReminder error:', err);
  }
}

// ── Daily goal incomplete — 8PM KSA (5PM UTC) ────────────────────────────────
export async function sendDailyGoalReminder(): Promise<void> {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const subs = await PushSubscription.find({});
    for (const sub of subs) {
      try {
        const results = await TestResult.find({
          userId: sub.userId,
          createdAt: { $gte: today },
        });
        const totalQ = results.reduce((a: number, r: any) => a + (r.totalQuestions || 0), 0);
        if (totalQ >= 10) continue;

        await sendToSubscription(sub, {
          title: '⏰ هدفك اليومي لم يكتمل!',
          body: `أنجزت ${totalQ} سؤال فقط. تبقى لك ${10 - totalQ} أسئلة لإكمال الهدف اليومي`,
          tag: 'daily-goal',
          url: '/question-bank',
          type: 'daily-goal',
          actions: [
            { action: 'open', title: '✅ أكمل الهدف الآن' },
          ],
        });
      } catch (_) { /* skip */ }
    }
    console.log('🔔 Daily goal reminders sent');
  } catch (err) {
    console.error('sendDailyGoalReminder error:', err);
  }
}

// ── Weekly report push — Sunday 8PM KSA (5PM UTC) ───────────────────────────
export async function sendPushWeeklyReport(): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const subs = await PushSubscription.find({});

    for (const sub of subs) {
      try {
        const results = await TestResult.find({
          userId: sub.userId,
          createdAt: { $gte: sevenDaysAgo },
        });
        const total = results.length;
        const scores = results.map((r: any) => r.score || r.totalScore || 0);
        const avg = total > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / total) : 0;

        const body = total === 0
          ? 'لم تُجرِ أي اختبارات هذا الأسبوع. ابدأ بـ 10 أسئلة يومياً! 💡'
          : `${total} اختبار هذا الأسبوع • متوسط ${avg}% ${avg >= 70 ? '🏆 رائع!' : '💪 استمر!'}`;

        await sendToSubscription(sub, {
          title: '📊 تقريرك الأسبوعي',
          body,
          tag: 'weekly-report',
          url: '/performance-report',
          type: 'weekly-report',
          actions: [
            { action: 'open', title: '📊 عرض التقرير' },
          ],
        });
      } catch (_) { /* skip */ }
    }
    console.log('🔔 Weekly push reports sent');
  } catch (err) {
    console.error('sendPushWeeklyReport error:', err);
  }
}

// ── Achievement unlock notification ──────────────────────────────────────────
export async function sendAchievementPush(userId: string, achievementTitle: string): Promise<void> {
  await sendPushToUser(userId, {
    title: '🏆 إنجاز جديد!',
    body: `حصلت على إنجاز: ${achievementTitle} 🎉`,
    tag: 'achievement',
    url: '/profile',
    type: 'achievement',
  });
}

// ── Streak milestone notification ─────────────────────────────────────────────
export async function sendStreakPush(userId: string, streakDays: number): Promise<void> {
  const messages: Record<number, string> = {
    3:  '3 أيام متتالية! أنت على الطريق الصحيح 🌱',
    7:  'أسبوع كامل بلا انقطاع! أنت مذهل 🔥',
    14: 'أسبوعان! ثباتك يُلهم 🚀',
    30: 'شهر كامل! أنت بطل المنصة 🏆👑',
  };
  const msg = messages[streakDays];
  if (!msg) return;
  await sendPushToUser(userId, {
    title: `🔥 ${streakDays} يوم متتالي!`,
    body: msg,
    tag: 'streak',
    url: '/question-bank',
    type: 'streak',
  });
}

// ── Start push scheduler ─────────────────────────────────────────────────────
export function startPushScheduler(): void {
  // Exam reminders every 5 minutes
  setInterval(sendPushExamReminders, 5 * 60 * 1000);
  setTimeout(sendPushExamReminders, 10 * 1000);

  // Hourly check for time-based notifications
  setInterval(async () => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcDay  = now.getUTCDay();

    // Daily study reminder: 7AM KSA = 4AM UTC
    if (utcHour === 4 && now.getUTCMinutes() < 60) {
      await sendDailyStudyReminder();
    }

    // Daily goal incomplete: 8PM KSA = 5PM UTC
    if (utcHour === 17 && now.getUTCMinutes() < 60) {
      await sendDailyGoalReminder();
    }

    // Weekly report: Sunday 8PM KSA = Sunday 5PM UTC
    if (utcDay === 0 && utcHour === 17 && now.getUTCMinutes() < 60) {
      await sendPushWeeklyReport();
    }
  }, 60 * 60 * 1000);

  console.log('🔔 Push notification scheduler started');
}
