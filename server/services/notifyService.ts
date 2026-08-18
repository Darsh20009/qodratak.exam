/**
 * notifyService.ts — نقطة الدخول الوحيدة للإشعارات
 *
 * fireNotify(userId, title, body, opts)
 *   ↓
 *   ├─ Layer 1 DB   → InAppNotification.create()        (يبقى حتى لو الجهاز مطفي)
 *   ├─ Layer 2 WS   → chatWebSocketServer.broadcastToUser()  (لحظي داخل التطبيق)
 *   └─ Layer 3 Push → webpush.sendNotification()        (خارج التطبيق)
 */

import webpush from 'web-push';
import { InAppNotification, PushSubscription, User } from '../mongodb/models';
import { chatWebSocketServer } from '../websocket';

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL   = process.env.VAPID_EMAIL       || 'mailto:admin@qodratak.site';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export interface NotifyOptions {
  type?:  'info' | 'success' | 'warning' | 'exam' | 'achievement' | 'event' | 'promo';
  icon?:  string;
  link?:  string;
  tag?:   string;
  sentBy?: string;
}

// ── Shared Web Push sender ────────────────────────────────────────────────────
async function sendWebPush(userId: string, title: string, body: string, opts: NotifyOptions = {}) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
  try {
    const subs = await PushSubscription.find({ userId });
    const payload = JSON.stringify({
      title,
      body,
      icon:  opts.icon  || '/logo-512x512.png',
      badge: '/logo-192x192.png',
      tag:   opts.tag   || `notif-${Date.now()}`,
      data:  { url: opts.link || '/' },
    });
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload, { TTL: 86400 });
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    }
  } catch (err) {
    console.warn('fireNotify – web push error:', err);
  }
}

// ── MAIN: fire notification for ONE user ──────────────────────────────────────
export async function fireNotify(
  userId: string,
  title: string,
  body: string,
  opts: NotifyOptions = {}
): Promise<void> {
  const type   = opts.type   || 'info';
  const sentBy = opts.sentBy || 'system';

  // Layer 1 — DB (persistent)
  try {
    await InAppNotification.create({
      userId,
      title,
      body,
      type,
      icon: opts.icon,
      link: opts.link,
      isGlobal: false,
      target: userId,
      sentBy,
    });
  } catch (err) {
    console.error('fireNotify – DB layer error:', err);
  }

  // Layer 2 — WebSocket (real-time in-app)
  try {
    chatWebSocketServer.broadcastToUser(userId, {
      type: 'new_notification',
      notification: { title, body, type, link: opts.link },
    });
  } catch (err) {
    console.warn('fireNotify – WS layer error:', err);
  }

  // Layer 3 — Web Push (out-of-app)
  await sendWebPush(userId, title, body, opts);
}

// ── ADMINS: notify all system_admin / support_admin ─────────────────────────
export async function fireNotifyAdmins(
  title: string,
  body: string,
  opts: NotifyOptions = {}
): Promise<void> {
  try {
    const admins = await User.find({
      role: { $in: ['system_admin', 'support_admin', 'institution_admin'] },
      isActive: true,
    }).select('_id');

    await Promise.all(
      admins.map((a) => fireNotify(String(a._id), title, body, { ...opts, sentBy: 'system' }))
    );
  } catch (err) {
    console.error('fireNotifyAdmins error:', err);
  }
}

// ── BROADCAST: notify ALL active users (global announcement) ─────────────────
export async function fireNotifyBroadcast(
  title: string,
  body: string,
  opts: NotifyOptions = {}
): Promise<void> {
  const type   = opts.type   || 'info';
  const sentBy = opts.sentBy || 'system';
  try {
    // DB — one global record
    await InAppNotification.create({
      title, body, type,
      icon: opts.icon,
      link: opts.link,
      isGlobal: true,
      target: 'global',
      sentBy,
    });

    // WS — broadcast to everyone online
    chatWebSocketServer.broadcastToAll({
      type: 'new_notification',
      notification: { title, body, type, link: opts.link },
    });

    // Web Push — all subscribers
    if (VAPID_PUBLIC && VAPID_PRIVATE) {
      const subs = await PushSubscription.find({});
      const payload = JSON.stringify({
        title, body,
        icon:  opts.icon || '/logo-512x512.png',
        badge: '/logo-192x192.png',
        tag:   opts.tag  || `broadcast-${Date.now()}`,
        data:  { url: opts.link || '/' },
      });
      for (const sub of subs) {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload, { TTL: 86400 });
        } catch (e: any) {
          if (e.statusCode === 410 || e.statusCode === 404) {
            await PushSubscription.deleteOne({ _id: sub._id });
          }
        }
      }
    }
  } catch (err) {
    console.error('fireNotifyBroadcast error:', err);
  }
}
