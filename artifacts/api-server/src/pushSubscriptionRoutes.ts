import { Router, type Request, type Response } from 'express';
import { requireAuth } from './middleware/rbac';
import { PushSubscription } from './mongodb/models';
import {
  parseObjectIdString,
  parsePushSubscription,
  parseBoundedText,
} from './notificationValidation';

type PushSubscriptionModel = Pick<
  typeof PushSubscription,
  'findOneAndUpdate' | 'deleteOne' | 'deleteMany'
>;

export function createPushSubscriptionRouter(
  model: PushSubscriptionModel = PushSubscription,
) {
  const router = Router();

  router.post('/subscribe', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseObjectIdString((req as any).session?.userId);
      const subscription = parsePushSubscription({
        endpoint: req.body?.endpoint,
        keys: req.body?.keys,
      });
      if (!userId || !subscription) {
        return res.status(400).json({ error: 'بيانات الاشتراك غير صالحة' });
      }

      await model.findOneAndUpdate(
        { endpoint: subscription.endpoint, userId },
        { userId, endpoint: subscription.endpoint, keys: subscription.keys },
        { upsert: true, new: true },
      );
      return res.json({ success: true });
    } catch (error) {
      console.error('push subscribe error:', error);
      return res.status(500).json({ error: 'فشل حفظ الاشتراك' });
    }
  });

  router.delete('/unsubscribe', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseObjectIdString((req as any).session?.userId);
      if (!userId) {
        return res.status(400).json({ error: 'معرف المستخدم غير صالح' });
      }

      if (req.body?.endpoint === undefined) {
        await model.deleteMany({ userId });
      } else {
        const endpoint = parseBoundedText(req.body.endpoint, 2048);
        if (!endpoint) {
          return res.status(400).json({ error: 'بيانات الاشتراك غير صالحة' });
        }
        await model.deleteOne({ endpoint, userId });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error('push unsubscribe error:', error);
      return res.status(500).json({ error: 'فشل إلغاء الاشتراك' });
    }
  });

  return router;
}