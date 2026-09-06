import { User, ExamBooking, TestResult } from '../mongodb/models';
import { sendStudentWhatsAppNotification } from './studentWhatsAppNotifications';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// ── Send a Telegram message to a chat ────────────────────────────────────────
export async function sendTelegramMessage(chatId: number | string, text: string): Promise<boolean> {
  if (!BOT_TOKEN || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return res.ok;
  } catch (err) {
    console.error('Telegram sendMessage error:', err);
    return false;
  }
}

// ── Exam reminder (1-hour window) ─────────────────────────────────────────────
export async function checkTelegramExamReminders(): Promise<void> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 55 * 60 * 1000);  // 55 min
    const windowEnd   = new Date(now.getTime() + 65 * 60 * 1000);  // 65 min

    const bookings = await ExamBooking.find({
      status: 'pending',
      telegramReminderSent: { $ne: true },
      scheduledAt: { $gte: windowStart, $lte: windowEnd },
    });

    for (const booking of bookings) {
      try {
        const user = await User.findOne({ _id: booking.userId });
        if (!user) continue;
        if (user.notifExamReminder === false) continue;

        const chatId = user.telegramChatId || (user.telegramId ? Number(user.telegramId) : null);

        const examDate = new Date(booking.scheduledAt);
        const timeStr = examDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Riyadh' });

        const msg =
          `⏰ <b>تذكير باختبار القياس</b>\n\n` +
          `مرحباً ${user.fullName || user.username}،\n\n` +
          `🎓 اختبارك المحجوز يبدأ بعد <b>ساعة تقريباً</b>\n` +
          `🕐 الوقت المحدد: <b>${timeStr}</b>\n\n` +
          `✅ تأكد من:\n` +
          `• اتصالك بالإنترنت\n` +
          `• وجودك في مكان هادئ\n` +
          `• شحن جهازك\n\n` +
          `بالتوفيق! 🌟\n` +
          `<i>منصة قدراتك</i>`;

        const sent = chatId ? await sendTelegramMessage(chatId, msg) : false;
        const whatsappResult = await sendStudentWhatsAppNotification(String(user._id), {
          title: 'تذكير بالاختبار',
          body: msg.replace(/<[^>]+>/g, ''),
          link: '/book-exam',
          type: 'exam',
        }).catch((error) => {
          console.error('WhatsApp exam reminder failed:', error);
          return { sent: false };
        });
        if (sent || whatsappResult.sent) {
          await ExamBooking.updateOne({ _id: booking._id }, { telegramReminderSent: true });
          console.log(`📱 Exam reminder sent to user ${user._id} for exam at ${timeStr}`);
        }
      } catch (err) {
        console.error(`Telegram reminder error for booking ${booking._id}:`, err);
      }
    }
  } catch (err) {
    console.error('checkTelegramExamReminders error:', err);
  }
}

// ── Weekly report ─────────────────────────────────────────────────────────────
export async function sendWeeklyReports(): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const users = await User.find({
      notifWeeklyReport: { $ne: false },
      $or: [
        { weeklyReportLastSent: { $lt: sevenDaysAgo } },
        { weeklyReportLastSent: { $exists: false } },
      ],
      $and: [
        {
          $or: [
            { telegramChatId: { $gt: 0 } },
            { telegramId: { $exists: true, $ne: '' } },
            { phone: { $exists: true, $ne: '' } },
            { whatsappPhone: { $exists: true, $ne: '' } },
          ],
        },
      ],
    }).limit(500);

    for (const user of users) {
      try {
        const chatId = user.telegramChatId || (user.telegramId ? Number(user.telegramId) : null);

        // Aggregate last 7 days of test results
        const results = await TestResult.find({
          userId: String(user._id),
          createdAt: { $gte: sevenDaysAgo },
        });

        const totalTests = results.length;
        let msg = '';
        if (totalTests === 0) {
          // Still send a gentle nudge
          msg =
            `📊 <b>تقريرك الأسبوعي</b>\n\n` +
            `مرحباً ${user.fullName || user.username}،\n\n` +
            `لم تُجرِ أي اختبارات هذا الأسبوع.\n\n` +
            `💡 ابدأ بـ <b>10 أسئلة</b> يومياً وستلاحظ الفرق!\n\n` +
            `<i>منصة قدراتك</i>`;
          if (chatId) await sendTelegramMessage(chatId, msg);
        } else {
          const scores = results.map(r => (r as any).score || (r as any).totalScore || 0);
          const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          const best = Math.max(...scores);
          const totalQ = results.reduce((a, r) => a + ((r as any).totalQuestions || 0), 0);
          const correctQ = results.reduce((a, r) => a + ((r as any).correctAnswers || 0), 0);
          const accuracy = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

          const trend = avg >= 70 ? '📈 ممتاز' : avg >= 50 ? '📊 جيد' : '📉 تحتاج مراجعة';
          const emoji = avg >= 80 ? '🏆' : avg >= 60 ? '⭐' : '💪';

          msg =
            `📊 <b>تقريرك الأسبوعي</b>\n\n` +
            `مرحباً ${user.fullName || user.username}! ${emoji}\n\n` +
            `<b>إحصائيات الأسبوع:</b>\n` +
            `📝 عدد الاختبارات: <b>${totalTests}</b>\n` +
            `🎯 متوسط النتيجة: <b>${avg}%</b>\n` +
            `🥇 أفضل نتيجة: <b>${best}%</b>\n` +
            `✅ دقة الإجابات: <b>${accuracy}%</b>\n\n` +
            `${trend}\n\n` +
            `${avg >= 70 ? 'استمر بهذا الأداء الرائع! 🔥' : 'لا تستسلم، التحسن يتطلب مثابرة 💪'}\n\n` +
            `<i>منصة قدراتك</i>`;
          if (chatId) await sendTelegramMessage(chatId, msg);
        }

        const whatsappResult = await sendStudentWhatsAppNotification(String(user._id), {
          title: 'تقريرك الأسبوعي',
          body: msg.replace(/<[^>]+>/g, ''),
          link: '/reports',
          type: 'info',
          createInApp: false,
        }).catch((error) => {
          console.error(`Weekly WhatsApp report error for user ${user._id}:`, error);
          return { sent: false };
        });
        if (chatId || whatsappResult.sent) {
          await User.updateOne({ _id: user._id }, { weeklyReportLastSent: new Date() });
          console.log(`📊 Weekly report sent to user ${user._id}`);
        }
      } catch (err) {
        console.error(`Weekly report error for user ${user._id}:`, err);
      }
    }
  } catch (err) {
    console.error('sendWeeklyReports error:', err);
  }
}

// ── Start all notification schedulers ─────────────────────────────────────────
export function startNotificationScheduler(): void {
  if (!process.env.MONGODB_URI) {
    console.log('Notification scheduler is inactive until MongoDB is configured');
    return;
  }

  // Check exam reminders every 5 minutes
  setInterval(checkTelegramExamReminders, 5 * 60 * 1000);
  // Run once immediately on boot
  setTimeout(checkTelegramExamReminders, 30 * 1000);

  console.log('Notification scheduler started (Telegram reminders only; bulk WhatsApp disabled)');
}
