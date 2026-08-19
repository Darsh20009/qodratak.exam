import { Router, Request, Response } from 'express';
import webpush from 'web-push';
import { InAppNotification, PushSubscription } from './mongodb/models';
import { chatWebSocketServer } from './websocket';

const router = Router();

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@qodratak.sa';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

// ── GET VAPID PUBLIC KEY ──────────────────────────────────────────────────────
router.get('/vapid-public-key', (req: Request, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// ── SUBSCRIBE TO PUSH NOTIFICATIONS ──────────────────────────────────────────
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { subscription, userId } = req.body;
    if (!subscription || !userId) {
      return res.status(400).json({ error: 'Missing subscription or userId' });
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
router.delete('/subscribe', async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ endpoint });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// ── ADMIN: GET ALL GLOBAL NOTIFICATIONS (must be before /in-app/:userId) ──────
router.get('/in-app/global', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await InAppNotification.find({ isGlobal: true })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global notifications' });
  }
});

// ── GET IN-APP NOTIFICATIONS FOR USER ────────────────────────────────────────
router.get('/in-app/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const notifications = await InAppNotification.find({
      $or: [{ userId }, { isGlobal: true }]
    }).sort({ createdAt: -1 }).limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ── MARK NOTIFICATION AS READ ─────────────────────────────────────────────────
router.patch('/in-app/:id/read', async (req: Request, res: Response) => {
  try {
    await InAppNotification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ── USER: DELETE OWN NOTIFICATION ────────────────────────────────────────────
router.delete('/in-app/:id', async (req: Request, res: Response) => {
  try {
    await InAppNotification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ── MARK ALL AS READ ──────────────────────────────────────────────────────────
router.patch('/in-app/mark-all-read/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
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
router.get('/in-app/:userId/unread-count', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
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
router.post('/admin/send', async (req: Request, res: Response) => {
  try {
    const { title, body, type, link, targetUserId, isGlobal, sentBy } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body required' });
    }

    const notification = await InAppNotification.create({
      userId: isGlobal ? undefined : targetUserId,
      title,
      body,
      type: type || 'info',
      link,
      isGlobal: isGlobal || false,
      sentBy: sentBy || 'admin',
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

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ── ADMIN: GET ALL NOTIFICATIONS ──────────────────────────────────────────────
router.get('/admin/all', async (req: Request, res: Response) => {
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
router.get('/push/stats', async (req: Request, res: Response) => {
  try {
    const totalSubscriptions = await PushSubscription.countDocuments();
    const totalNotifications = await InAppNotification.countDocuments();
    res.json({ totalSubscriptions, totalNotifications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch push stats' });
  }
});

// ── ADMIN: BROADCAST IN-APP NOTIFICATION ──────────────────────────────────────
router.post('/in-app/broadcast', async (req: Request, res: Response) => {
  try {
    const { title, body, type, target, link } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body required' });

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

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Broadcast in-app error:', error);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

// ── ADMIN: BROADCAST PUSH NOTIFICATION ────────────────────────────────────────
router.post('/push/broadcast', async (req: Request, res: Response) => {
  try {
    const { title, body, target, link } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body required' });

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
router.delete('/admin/:id', async (req: Request, res: Response) => {
  try {
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
