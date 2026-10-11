import { Router } from "express";
import { SupportTicket } from "../mongodb/models";
import { logger } from "../lib/logger";
import { SupportTicketInputError, supportTicketReference, validateSupportTicketInput } from "../services/supportTicketInput";
import { deliverSupportTicketNotification, startSupportTicketNotificationWorker } from "../services/supportTicketNotifications";

const router = Router();
const submissions = new Map<string, { count: number; expires: number }>();
startSupportTicketNotificationWorker();

router.post("/support-tickets", async (req, res) => {
  try {
    const input = validateSupportTicketInput(req.body);
    const now = Date.now();
    if (submissions.size > 5000) for (const [ip, entry] of submissions) if (entry.expires < now) submissions.delete(ip);
    const ip = req.ip || "unknown";
    const previous = submissions.get(ip);
    const entry = previous && previous.expires > now ? previous : { count: 0, expires: now + 60 * 60_000 };
    if (entry.count >= 5 || (!previous && submissions.size > 5000)) {
      res.setHeader("Retry-After", Math.max(1, Math.ceil((entry.expires - now) / 1000)));
      return res.status(429).json({ error: "وصلت للحد المسموح لإرسال التذاكر. حاول لاحقًا." });
    }
    entry.count++;
    submissions.set(ip, entry);
    const existing = await SupportTicket.findOne({ requestId: input.requestId });
    if (existing) {
      if (existing.requestFingerprint !== input.requestFingerprint) return res.status(409).json({ error: "تغيّرت بيانات الطلب؛ أعد إرسال النموذج." });
      return res.json({ success: true, ticketId: String(existing._id), reference: supportTicketReference(existing._id), notificationStatus: existing.whatsappNotificationStatus });
    }
    const fields = {
      ...input, userId: (req.session as unknown as { userId?: string })?.userId,
      subject: "شكوى عميل", status: "open" as const, priority: "medium" as const,
      whatsappNotificationStatus: "pending" as const, whatsappAttempts: 0,
    };
    let ticket;
    let created = true;
    try {
      ticket = await SupportTicket.create(fields);
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      ticket = await SupportTicket.findOne({ requestId: input.requestId });
      if (!ticket || ticket.requestFingerprint !== input.requestFingerprint) return res.status(409).json({ error: "تعذر إعادة هذا الطلب. أعد إرسال النموذج." });
      created = false;
    }
    if (created) void deliverSupportTicketNotification(String(ticket._id)).catch(() => logger.warn({ ticketId: String(ticket._id) }, "Support ticket notification deferred"));
    return res.status(created ? 201 : 200).json({
      success: true, ticketId: String(ticket._id), reference: supportTicketReference(ticket._id),
      notificationStatus: ticket.whatsappNotificationStatus,
    });
  } catch (error) {
    if (error instanceof SupportTicketInputError) return res.status(400).json({ error: error.message });
    logger.error("Support ticket creation failed");
    return res.status(503).json({ error: "تعذر حفظ الشكوى الآن. بياناتك لم تُمسح؛ حاول مجددًا." });
  }
});
export default router;
