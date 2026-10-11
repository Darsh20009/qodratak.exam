import { SupportTicket } from "../mongodb/models";
import { logger } from "../lib/logger";
import { getAdminPhone } from "./adminWhatsAppNotifications";
import { sendWhatsAppText } from "./whatsappService";
import { supportTicketReference } from "./supportTicketInput";

export async function deliverSupportTicketNotification(ticketId: string) {
  const now = new Date();
  const ticket = await SupportTicket.findOneAndUpdate({
    _id: ticketId,
    whatsappAttempts: { $lt: 3 },
    $and: [
      { $or: [
        { whatsappNotificationStatus: { $in: ["pending", "failed"] } },
        { whatsappNotificationStatus: "sending", whatsappLockedUntil: { $lte: now } },
      ] },
      { $or: [
        { whatsappNextAttemptAt: { $exists: false } },
        { whatsappNextAttemptAt: { $lte: now } },
      ] },
    ],
  }, {
    $set: { whatsappNotificationStatus: "sending", whatsappLockedUntil: new Date(Date.now() + 15 * 60_000) },
    $inc: { whatsappAttempts: 1 },
  }, { new: true });
  if (!ticket) return;
  try {
    const phone = await getAdminPhone();
    const name = ticket.userName.replace(/[\r\n\u202a-\u202e\u2066-\u2069]/g, " ");
    await sendWhatsAppText(phone, [
      "تذكرة شكوى جديدة — قدراتك",
      `المرجع: ${supportTicketReference(ticket._id)}`,
      `العميل: ${name}`,
      "التفاصيل وبيانات التواصل متاحة في لوحة الإدارة ← الدعم الفني.",
    ].join("\n"), "admin_support_ticket");
    await SupportTicket.updateOne({ _id: ticket._id }, {
      $set: { whatsappNotificationStatus: "sent" },
      $unset: { whatsappLockedUntil: 1, whatsappNextAttemptAt: 1 },
    });
  } catch {
    await SupportTicket.updateOne({ _id: ticket._id }, {
      $set: {
        whatsappNotificationStatus: "failed",
        whatsappNextAttemptAt: new Date(Date.now() + 60_000 * (ticket.whatsappAttempts || 1)),
      },
      $unset: { whatsappLockedUntil: 1 },
    });
    logger.warn({ ticketId: String(ticket._id) }, "Support ticket saved; WhatsApp notification failed");
  }
}

let running = false;
let started = false;
export function startSupportTicketNotificationWorker() {
  if (started) return;
  started = true;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const now = new Date();
      const tickets = await SupportTicket.find({
        whatsappNotificationStatus: { $in: ["pending", "failed", "sending"] },
        whatsappAttempts: { $lt: 3 },
        $and: [
          { $or: [{ whatsappNextAttemptAt: { $exists: false } }, { whatsappNextAttemptAt: { $lte: now } }] },
          { $or: [{ whatsappLockedUntil: { $exists: false } }, { whatsappLockedUntil: { $lte: now } }] },
        ],
      }).sort({ createdAt: 1 }).limit(10).select("_id").lean();
      for (const ticket of tickets) await deliverSupportTicketNotification(String(ticket._id));
    } catch {
      logger.warn("Support ticket notification worker could not complete this cycle");
    } finally {
      running = false;
    }
  }, 60_000);
  timer.unref();
}
