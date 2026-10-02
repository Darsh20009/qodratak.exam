import crypto from "crypto";
import { Request, RequestHandler, Response, Router } from "express";
import mongoose from "mongoose";
import { Subscription, User } from "../mongodb/models";
import {
  GeideaConfigurationError,
  GeideaRequestError,
  createGeideaSession,
  getGeideaPublicAppUrl,
  isGeideaSandboxConfigured,
  verifyGeideaCallbackPayload,
} from "../services/geideaService";
import {
  publicGeideaPaymentStatus,
  reconcileGeideaSubscriptionPayment,
} from "../services/geideaPaymentService";

type Plan = {
  type: string;
  priceSar: number;
  durationDays: number;
};

type RouterOptions = {
  requireAuth: RequestHandler;
  getPlanByKey: (planKey: string) => Promise<Plan | null>;
};

async function findSessionUser(req: Request): Promise<any | null> {
  const session = (req as any).session;
  const userId = String(session?.userId || "");
  if (mongoose.Types.ObjectId.isValid(userId)) {
    const user = await User.findById(userId);
    if (user) return user;
  }
  const email = String(session?.userEmail || "").trim().toLowerCase();
  const username = String(session?.username || "").trim();
  const identityQuery = [
    ...(email ? [{ email }] : []),
    ...(username ? [{ username }] : []),
  ];
  return identityQuery.length ? User.findOne({ $or: identityQuery }) : null;
}

function paymentOwnerCandidates(userId: unknown): Array<string | mongoose.Types.ObjectId> {
  const value = String(userId);
  const candidates: Array<string | mongoose.Types.ObjectId> = [value];
  if (mongoose.Types.ObjectId.isValid(value)) {
    candidates.push(new mongoose.Types.ObjectId(value));
  }
  return candidates;
}

export function createGeideaPaymentRouter(options: RouterOptions): Router {
  const router = Router();

  router.post("/subscription/geidea/sessions", options.requireAuth, async (req: Request, res: Response) => {
    try {
      const planKey = String(req.body?.planKey || "");
      if (!["pro", "proLifePlus"].includes(planKey)) {
        res.status(400).json({ error: "الخطة المطلوبة غير متاحة" });
        return;
      }
      if (!isGeideaSandboxConfigured()) {
        res.status(503).json({ error: "الدفع التجريبي غير مُعدّ بعد" });
        return;
      }

      const plan = await options.getPlanByKey(planKey);
      const amount = Number(plan?.priceSar);
      const durationDays = Number(plan?.durationDays);
      if (!plan || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(durationDays) || durationDays < 1) {
        res.status(400).json({ error: "تعذر التحقق من سعر الخطة" });
        return;
      }
      const user = await findSessionUser(req);
      if (!user) {
        res.status(404).json({ error: "تعذر العثور على حسابك في قاعدة البيانات" });
        return;
      }

      const now = new Date();
      const activeSubscription = await Subscription.findOne({
        userId: { $in: paymentOwnerCandidates(user._id) },
        status: "active",
        startDate: { $lte: now },
        endDate: { $gt: now },
      }).sort({ endDate: -1 });
      const startDate =
        activeSubscription?.endDate && activeSubscription.endDate > now
          ? new Date(activeSubscription.endDate)
          : now;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);
      const merchantReferenceId = crypto.randomUUID();
      const payment = new Subscription({
        userId: user._id,
        type: plan.type,
        status: "pending",
        startDate,
        endDate,
        autoRenew: false,
        paymentMethod: "geidea",
        paymentGateway: "geidea",
        paymentStatus: "session_created",
        planKey,
        durationDays,
        currency: "SAR",
        providerMerchantReferenceId: merchantReferenceId,
        price: amount,
      } as any);
      await payment.save();

      try {
        const publicAppUrl = getGeideaPublicAppUrl();
        const checkout = await createGeideaSession({
          amount,
          merchantReferenceId,
          callbackUrl: `${publicAppUrl}/api/payments/geidea/callback`,
          returnUrl: `${publicAppUrl}/payment/geidea/return?paymentId=${encodeURIComponent(String(payment._id))}`,
          customer: {
            email: user.email || undefined,
            phoneNumber: user.whatsappPhone || user.phone || undefined,
            firstName: String(user.fullName || user.username || "").trim().split(/\s+/)[0] || undefined,
            lastName: String(user.fullName || "").trim().split(/\s+/).slice(1).join(" ") || undefined,
          },
        });
        await Subscription.updateOne(
          { _id: payment._id, paymentStatus: "session_created" },
          { $set: { providerSessionId: checkout.sessionId, updatedAt: new Date() } },
        );
        res.status(201).json({
          paymentId: String(payment._id),
          sessionId: checkout.sessionId,
          checkoutUrl: checkout.checkoutUrl,
        });
      } catch (error) {
        await Subscription.updateOne(
          { _id: payment._id, paymentStatus: "session_created" },
          {
            $set: {
              paymentStatus: "failed",
              status: "cancelled",
              providerStatus: "session_creation_failed",
              updatedAt: new Date(),
            },
          },
        );
        if (error instanceof GeideaConfigurationError) {
          req.log.warn({ error: error.message }, "Geidea sandbox configuration is incomplete");
          res.status(503).json({ error: "إعدادات الدفع التجريبي غير مكتملة" });
          return;
        }
        if (
          error instanceof GeideaRequestError &&
          error.responseCode === "110" &&
          error.detailedResponseCode === "080"
        ) {
          req.log.warn(
            {
              responseCode: error.responseCode,
              detailedResponseCode: error.detailedResponseCode,
            },
            "Geidea online payments are not configured for this merchant",
          );
          res.status(503).json({
            error: "الدفع الإلكتروني غير متاح حاليًا. يرجى المحاولة لاحقًا أو التواصل مع الدعم.",
          });
          return;
        }
        req.log.error(
          {
            statusCode: error instanceof GeideaRequestError ? error.statusCode : undefined,
            responseCode: error instanceof GeideaRequestError ? error.responseCode : undefined,
            detailedResponseCode: error instanceof GeideaRequestError ? error.detailedResponseCode : undefined,
          },
          "Geidea could not create a checkout session",
        );
        res.status(502).json({ error: "تعذر إنشاء جلسة الدفع لدى Geidea" });
      }
    } catch (error) {
      req.log.error({ error }, "Could not start Geidea checkout");
      res.status(500).json({ error: "تعذر بدء عملية الدفع" });
    }
  });

  router.get(
    "/subscription/geidea/payments/:paymentId",
    options.requireAuth,
    async (req: Request, res: Response) => {
      try {
        const paymentId = String(req.params.paymentId || "");
        if (!mongoose.Types.ObjectId.isValid(paymentId)) {
          res.status(404).json({ error: "عملية الدفع غير موجودة" });
          return;
        }
        const user = await findSessionUser(req);
        if (!user) {
          res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
          return;
        }
        const payment = await Subscription.findOne({
          _id: paymentId,
          userId: { $in: paymentOwnerCandidates(user._id) },
          paymentGateway: "geidea",
        });
        if (!payment) {
          res.status(404).json({ error: "عملية الدفع غير موجودة" });
          return;
        }

        const reconciled = await reconcileGeideaSubscriptionPayment(paymentId);
        if (!reconciled) {
          res.status(404).json({ error: "عملية الدفع غير موجودة" });
          return;
        }
        res.json(publicGeideaPaymentStatus(reconciled));
      } catch (error) {
        req.log.error({ error }, "Could not verify Geidea payment status");
        res.status(503).json({ error: "تعذر التحقق من حالة الدفع الآن" });
      }
    },
  );

  router.post("/payments/geidea/callback", async (req: Request, res: Response) => {
    try {
      if (!isGeideaSandboxConfigured()) {
        res.status(503).json({ error: "Geidea sandbox is not configured" });
        return;
      }
      const payload =
        req.body && typeof req.body === "object"
          ? (req.body as Record<string, unknown>)
          : {};
      const value = (names: string[]) => {
        const entry = Object.entries(payload).find(([key]) =>
          names.some((name) => name.toLowerCase() === key.toLowerCase()),
        );
        return entry?.[1];
      };
      const merchantReferenceId = String(value(["merchantReferenceId", "merchantReference"]) || "");
      const orderId = String(value(["orderId"]) || "");
      const amount = Number(value(["amount", "orderAmount"]));
      const currency = String(value(["currency", "orderCurrency"]) || "");
      const status = String(value(["status"]) || "");
      const timestamp = String(value(["timestamp", "timeStamp"]) || "");
      const signature = String(value(["signature"]) || "");

      if (!merchantReferenceId || !orderId || !Number.isFinite(amount) || !currency || !status || !timestamp || !signature) {
        res.status(400).json({ error: "بيانات إشعار الدفع غير مكتملة" });
        return;
      }
      if (!verifyGeideaCallbackPayload({
        amount,
        currency,
        orderId,
        status,
        merchantReferenceId,
        timestamp,
        signature,
      })) {
        req.log.warn("Rejected Geidea callback with an invalid signature");
        res.status(401).json({ error: "توقيع إشعار الدفع غير صالح" });
        return;
      }

      const payment = await Subscription.findOne({
        paymentGateway: "geidea",
        providerMerchantReferenceId: merchantReferenceId,
      });
      if (!payment) {
        res.status(404).json({ error: "عملية الدفع غير معروفة" });
        return;
      }
      const reconciled = await reconcileGeideaSubscriptionPayment(String(payment._id));
      if (!reconciled) {
        res.status(404).json({ error: "عملية الدفع غير معروفة" });
        return;
      }
      res.json({ received: true, status: reconciled.paymentStatus || "pending" });
    } catch (error) {
      req.log.error({ error }, "Could not reconcile Geidea callback");
      res.status(503).json({ error: "تعذر التحقق من إشعار الدفع" });
    }
  });

  return router;
}
