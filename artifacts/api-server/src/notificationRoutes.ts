import { Router, Request, Response } from 'express';
import webpush from 'web-push';
import { InAppNotification, PushSubscription } from './mongodb/models';
import { chatWebSocketServer } from './websocket';
import { requireAdmin, requireAuth } from './middleware/rbac';
import { sendStudentWhatsAppNotification } from './services/studentWhatsAppNotifications';
import { sendWhatsAppCampaign } from './services/adminWhatsAppNotifications';

const router = Router();

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@qodratak.sa';
const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;
const NOTIFICATION_TYPES = new Set(['info', 'success', 'warning', 'exam', 'achievement', 'event', 'promo']);

function sessionUserId(req: Request): string | null {
  const userId = (req.session as any)?.userId;
  return typeof userId === 'string' && OBJECT_ID_RE.test(userId) ? userId : null;
}

function validText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

// ── GET VAPID PUBLIC KEY ──────────────────────────────────────────────────────
router.get('/vapid-public-key', (req: Request, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// ── SUBSCRIBE TO PUSH NOTIFICATIONS ──────────────────────────────────────────
router.post('/subscribe', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = sessionUserId(req);
    const { subscription } = req.body;
    if (!userId || !subscription || typeof subscription !== 'object' ||
      !validText(subscription.endpoint, 2048) ||
      !subscription.keys || typeof subscription.keys !== 'object' ||
      !validText(subscription.keys.p256dh, 512) ||
      !validText(subscription.keys.auth, 512)) {
      return res.status(400).json({ error: 'Invalid push subscription' });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { userId, endpoint: subscription.endpoint, keys: subscription.keys },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// ── UNSUBSCRIBE FROM PUSH NOTIFICATIONS ──────────────────────────────────────
router.delete('/subscribe', requireAuth, async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;
    const userId = sessionUserId(req);
    if (!userId || !validText(endpoint, 2048)) {
      return res.status(400).json({ error: 'Invalid push subscription' });
    }
    await PushSubscription.deleteOne({ endpoint, userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// ── ADMIN: GET ALL GLOBAL NOTIFICATIONS (must be before /in-app/:userId) ──────
router.get('/in-app/global', requireAdmin, async (req: Request, res: Response) => {
  try {
    const requestedLimit = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : 50;
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
    const notifications = await InAppNotification.find({ isGlobal: true })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global notifications' });
  }
});

// ── GET IN-APP NOTIFICATIONS FOR USER ────────────────────────────────────────
router.get('/in-app/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = sessionUserId(req);
    if (!userId || req.params.userId !== userId) {
      return res.status(403).json({ error: 'غير مصرح - لا تملك صلاحية الوصول لهذه الإشعارات' });
    }
    const notifications = await InAppNotification.find({
      $or: [{ userId }, { isGlobal: true }]
    }).sort({ createdAt: -1 }).limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ── ADMIN: SEND PERSONAL IN-APP NOTIFICATION ─────────────────────────────────
router.post('/in-app/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, body, type, link, sendWhatsApp } = req.body || {};
    if (
      !OBJECT_ID_RE.test(req.params.userId) ||
      !validText(title, 200) ||
      !validText(body, 2000) ||
      (type !== undefined && (typeof type !== 'string' || !NOTIFICATION_TYPES.has(type))) ||
      (link !== undefined && (typeof link !== 'string' || link.length > 2048)) ||
      (sendWhatsApp !== undefined && typeof sendWhatsApp !== 'boolean')
    ) {
      return res.status(400).json({ error: 'Invalid notification data' });
    }

    const notification = await InAppNotification.create({
      userId: req.params.userId,
      title,
      body,
      type: type || 'info',
      link,
      isGlobal: false,
      sentBy: 'admin',
      isRead: false,
    });
    chatWebSocketServer.broadcastToUser(req.params.userId, { type: 'new_notification', notification });

    if (sendWhatsApp) {
      await sendStudentWhatsAppNotification(req.params.userId, {
        title,
        body,
        link,
        type: type || 'info',
        createInApp: false,
      });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Personal in-app notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ── MARK NOTIFICATION AS READ ─────────────────────────────────────────────────
router.patch('/in-app/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = sessionUserId(req);
    if (!userId || !OBJECT_ID_RE.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }
    await InAppNotification.findOneAndUpdate(
      { _id: req.params.id, $or: [{ userId }, { isGlobal: true }] },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ── USER: DELETE OWN NOTIFICATION ────────────────────────────────────────────
router.delete('/in-app/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = sessionUserId(req);
    if (!userId || !OBJECT_ID_RE.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }
    await InAppNotification.findOneAndDelete({ _id: req.params.id, userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ── MARK ALL AS READ ──────────────────────────────────────────────────────────
router.patch('/in-app/mark-all-read/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = sessionUserId(req);
    if (!userId || req.params.userId !== userId) {
      return res.status(403).json({ error: 'غير مصرح - لا تملك صلاحية الوصول لهذه الإشعارات' });
    }
    await InAppNotification.updateMany(
      { $or: [{ userId }, { isGlobal: true }], isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// ── GET UNREAD COUNT ──────────────────────────────────────────────────────────
router.get('/in-app/:userId/unread-count', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = sessionUserId(req);
    if (!userId || req.params.userId !== userId) {
      return res.status(403).json({ error: 'غير مصرح - لا تملك صلاحية الوصول لهذه الإشعارات' });
    }
    const count = await InAppNotification.countDocuments({
      $or: [{ userId }, { isGlobal: true }],
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get count' });
  }
});

// ── ADMIN: SEND NOTIFICATION ──────────────────────────────────────────────────
router.post('/admin/send', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, body, type, link, targetUserId, isGlobal, sendWhatsApp } = req.body;
    if (!validText(title, 200) || !validText(body, 2000) ||
      (type !== undefined && (typeof type !== 'string' || !NOTIFICATION_TYPES.has(type))) ||
      (link !== undefined && (typeof link !== 'string' || link.length > 2048)) ||
      typeof isGlobal !== 'boolean' ||
      (sendWhatsApp !== undefined && typeof sendWhatsApp !== 'boolean') ||
      (!isGlobal && (typeof targetUserId !== 'string' || !OBJECT_ID_RE.test(targetUserId)))) {
      return res.status(400).json({ error: 'Invalid notification data' });
    }

    const notification = await InAppNotification.create({
      userId: isGlobal ? undefined : targetUserId,
      title,
      body,
      type: type || 'info',
      link,
      isGlobal: isGlobal || false,
       sentBy: String((req as any).adminSession?.adminId || (req as any).rbacUser?.id || 'admin'),
      isRead: false,
    });

    // Send real-time WebSocket notification
    const wsPayload = { type: 'new_notification', notification };
    if (isGlobal) {
      chatWebSocketServer.broadcastToAll(wsPayload);
    } else if (targetUserId) {
      chatWebSocketServer.broadcastToUser(targetUserId, wsPayload);
    }

    // Also send push notification to subscribed devices
    if (VAPID_PUBLIC && VAPID_PRIVATE) {
      const query = isGlobal
        ? {}
        : { userId: targetUserId };

      const subscriptions = await PushSubscription.find(query);
      const pushPayload = JSON.stringify({ title, body, link, type });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            pushPayload
          );
        } catch (err: any) {
          if (err.statusCode === 410) {
            await PushSubscription.deleteOne({ endpoint: sub.endpoint });
          }
        }
      }
    }

    if (sendWhatsApp) {
      if (isGlobal) {
        await sendWhatsAppCampaign({
          title,
          body,
          target: 'all',
        });
      } else if (targetUserId) {
        await sendStudentWhatsAppNotification(targetUserId, {
          title,
          body,
          link,
          type: type || 'info',
          createInApp: false,
        });
      }
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ── ADMIN: GET ALL NOTIFICATIONS ──────────────────────────────────────────────
router.get('/admin/all', requireAdmin, async (req: Request, res: Response) => {
  try {
    const notifications = await InAppNotification.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ── ADMIN: PUSH SUBSCRIPTION STATS ────────────────────────────────────────────
router.get('/push/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const totalSubscriptions = await PushSubscription.countDocuments();
    const totalNotifications = await InAppNotification.countDocuments();
    res.json({ totalSubscriptions, totalNotifications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch push stats' });
  }
});

// ── ADMIN: BROADCAST IN-APP NOTIFICATION ──────────────────────────────────────
router.post('/in-app/broadcast', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, body, type, target, link, sendWhatsApp } = req.body;
    if (!validText(title, 200) || !validText(body, 2000) ||
      (type !== undefined && (typeof type !== 'string' || !NOTIFICATION_TYPES.has(type))) ||
      (target !== undefined && !['global', 'premium'].includes(target)) ||
      (link !== undefined && (typeof link !== 'string' || link.length > 2048)) ||
      (sendWhatsApp !== undefined && typeof sendWhatsApp !== 'boolean')) {
      return res.status(400).json({ error: 'Invalid notification data' });
    }

    const notification = await InAppNotification.create({
      title,
      body,
      type: type || 'info',
      link,
      isGlobal: true,
      target: target || 'global',
      sentBy: 'admin',
      isRead: false,
    });

    const wsPayload = { type: 'new_notification', notification };
    chatWebSocketServer.broadcastToAll(wsPayload);

    let whatsappResult = null;
    if (sendWhatsApp) {
      whatsappResult = await sendWhatsAppCampaign({
        title,
        body,
        target: target === 'premium' ? 'subscribed' : 'all',
      });
    }

    res.json({ success: true, notification, whatsapp: whatsappResult });
  } catch (error) {
    console.error('Broadcast in-app error:', error);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

// ── ADMIN: BROADCAST PUSH NOTIFICATION ────────────────────────────────────────
router.post('/push/broadcast', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, body, target, link } = req.body;
    if (!validText(title, 200) || !validText(body, 2000) ||
      (target !== undefined && target !== 'premium') ||
      (link !== undefined && (typeof link !== 'string' || link.length > 2048))) {
      return res.status(400).json({ error: 'Invalid notification data' });
    }

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return res.status(503).json({ error: 'Push notifications not configured' });
    }

    const query = target === 'premium' ? { plan: 'premium' } : {};
    const subscriptions = await PushSubscription.find(query);
    const pushPayload = JSON.stringify({ title, body, link: link || '/', type: 'info' });

    let sent = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          pushPayload
        );
        sent++;
      } catch (err: any) {
        if (err.statusCode === 410) {
          await PushSubscription.deleteOne({ endpoint: sub.endpoint });
        }
      }
    }

    res.json({ success: true, sent, total: subscriptions.length });
  } catch (error) {
    console.error('Push broadcast error:', error);
    res.status(500).json({ error: 'Failed to broadcast push notification' });
  }
});

// ── ADMIN: DELETE NOTIFICATION ────────────────────────────────────────────────
router.delete('/admin/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!OBJECT_ID_RE.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }
    await InAppNotification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ── SYSTEM: SEND EXAM REMINDER ────────────────────────────────────────────────
export async function sendExamReminder(userId: string, examTitle: string, minutesLeft: number) {
  try {
    const title = `⏰ تذكير: ${examTitle}`;
    const body = minutesLeft <= 0
      ? 'حان وقت اختبارك! ابدأ الآن'
      : `متبقي ${minutesLeft} دقيقة على اختبارك`;

    await InAppNotification.create({
      userId,
      title,
      body,
      type: 'exam',
      link: '/book-exam',
      isGlobal: false,
      sentBy: 'system',
    });

    chatWebSocketServer.broadcastToUser(userId, {
      type: 'new_notification',
      notification: { title, body, type: 'exam' }
    });

    await sendStudentWhatsAppNotification(userId, {
      title,
      body,
      link: '/book-exam',
      type: 'exam',
      createInApp: false,
    });

    if (VAPID_PUBLIC && VAPID_PRIVATE) {
      const subscriptions = await PushSubscription.find({ userId });
      const payload = JSON.stringify({ title, body, link: '/book-exam', type: 'exam' });
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
        } catch (e: any) {
          if (e.statusCode === 410) await PushSubscription.deleteOne({ endpoint: sub.endpoint });
        }
      }
    }
  } catch (err) {
    console.error('sendExamReminder error:', err);
  }
}

export default router;
