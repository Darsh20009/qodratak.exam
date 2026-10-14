import mongoose from "mongoose";
import { Subscription, User } from "../mongodb/models";
import { logger } from "../lib/logger";
import { notifyStudentSubscriptionActivated } from "./adminWhatsAppNotifications";
import { subscriptionPeriod, subscriptionPlanName } from "./subscriptionBilling";
import {
  fetchGeideaOrdersByMerchantReference,
  geideaPaymentIsFailed,
  geideaPaymentIsSuccessful,
  getGeideaPublicAppUrl,
} from "./geideaService";

type PaymentStatus =
  | "session_created"
  | "pending"
  | "paid"
  | "failed"
  | "refund_pending"
  | "refund_failed"
  | "refunded";

export const GEIDEA_PROCESSING_MS = 10 * 60_000;
const GEIDEA_LATE_RECHECK_MS = 5 * 60_000;
const GEIDEA_RECOVERY_MS = 24 * 60 * 60_000;

export function geideaProcessingDeadlinePassed(createdAt: Date | string | undefined, now = Date.now()): boolean {
  const started = new Date(createdAt || now).getTime();
  return Number.isFinite(started) && now >= started + GEIDEA_PROCESSING_MS;
}

function canReconcile(payment: any): boolean {
  return payment.status === "pending" && ["session_created", "pending"].includes(payment.paymentStatus)
    || payment.status === "cancelled" && (
      ["session_created", "pending"].includes(payment.paymentStatus)
      || payment.paymentStatus === "failed" && payment.providerStatus === "timeout_unconfirmed"
    );
}

function ownerCandidates(userId: unknown): Array<string | number | mongoose.Types.ObjectId> {
  const value = String(userId);
  const candidates: Array<string | number | mongoose.Types.ObjectId> = [value];
  if (/^\d+$/.test(value)) candidates.push(Number(value));
  if (mongoose.Types.ObjectId.isValid(value)) {
    candidates.push(new mongoose.Types.ObjectId(value));
  }
  return candidates;
}

export function subscriptionInvoiceNumber(subscription: {
  _id: unknown;
  createdAt?: Date | string;
}): string {
  const createdAt = subscription.createdAt ? new Date(subscription.createdAt) : new Date();
  const year = Number.isNaN(createdAt.getTime()) ? new Date().getFullYear() : createdAt.getFullYear();
  return `QDR-${year}-${String(subscription._id).slice(-8).toUpperCase()}`;
}

export function publicGeideaPaymentStatus(subscription: any, customer?: any) {
  const invoiceNumber = subscriptionInvoiceNumber(subscription);
  const billedTo = subscription.billingSnapshot?.name ? subscription.billingSnapshot : customer;
  const startDate = new Date(subscription.startDate).toISOString();
  const endDate = new Date(subscription.endDate).toISOString();
  return {
    paymentId: String(subscription._id),
    status: (subscription.paymentStatus || "pending") as PaymentStatus,
    plan: String(subscription.type || ""),
    amount: Number(subscription.price || 0),
    currency: String(subscription.currency || "SAR"),
    invoiceNumber: subscription.paymentStatus === "paid" ? invoiceNumber : null,
    providerOrderId: subscription.providerOrderId || null,
    paidAt: subscription.paidAt ? new Date(subscription.paidAt).toISOString() : null,
    startDate,
    endDate,
    durationDays: Number(subscription.durationDays || 0),
    invoice: subscription.paymentStatus === "paid" && billedTo ? {
      invoiceNumber,
      customerName: String(billedTo.name || billedTo.fullName || billedTo.username || "الطالب"),
      customerEmail: String(billedTo.email || ""),
      customerPhone: String(billedTo.phone || billedTo.whatsappPhone || ""),
      planName: subscriptionPlanName(subscription.type),
      amount: Number(subscription.price),
      currency: String(subscription.currency || "SAR"),
      paymentMethod: "geidea",
      issueDate: new Date(subscription.paidAt || subscription.createdAt).toISOString(),
      startDate,
      endDate,
      status: "active",
    } : null,
  };
}

export async function reconcileGeideaSubscriptionPayment(
  paymentId: string,
  options: { alreadyClaimed?: boolean } = {},
): Promise<any | null> {
  const payment = await Subscription.findOne({
    _id: paymentId,
    paymentGateway: "geidea",
  });
  if (!payment) return null;

  if (
    payment.paymentStatus === "paid" ||
    payment.paymentStatus === "refund_pending" ||
    payment.paymentStatus === "refund_failed" ||
    payment.paymentStatus === "refunded" ||
    !canReconcile(payment)
  ) {
    return payment;
  }

  if (!payment.providerMerchantReferenceId) return payment;
  if (!options.alreadyClaimed) {
    const now = new Date();
    const claimed = await Subscription.findOneAndUpdate({
      _id: payment._id,
      paymentGateway: "geidea",
      $or: [
        { providerNextCheckAt: { $exists: false } },
        { providerNextCheckAt: { $lte: now } },
      ],
    }, {
      $set: {
        providerNextCheckAt: new Date(now.getTime() +
          (payment.providerStatus === "timeout_unconfirmed" ? GEIDEA_LATE_RECHECK_MS : 5_000)),
      },
    }, { new: true }).select("_id");
    if (!claimed) return Subscription.findById(payment._id);
  }
  const orders = await fetchGeideaOrdersByMerchantReference(payment.providerMerchantReferenceId);
  const order = orders
    .filter((candidate) =>
      String(candidate?.merchantReferenceId || "") === payment.providerMerchantReferenceId
    )
    .sort((left, right) =>
      new Date(right?.updatedAt || right?.createdAt || 0).getTime() -
      new Date(left?.updatedAt || left?.createdAt || 0).getTime()
    )[0];
  if (!order) {
    if (geideaProcessingDeadlinePassed(payment.createdAt)) {
      await Subscription.updateOne({
        _id: payment._id,
        paymentGateway: "geidea",
        paymentStatus: { $in: ["session_created", "pending"] },
        status: { $in: ["pending", "cancelled"] },
      }, {
        $set: {
          paymentStatus: "failed",
          status: "cancelled",
          providerStatus: "timeout_unconfirmed",
          updatedAt: new Date(),
        },
      });
      return Subscription.findById(payment._id);
    }
    return payment;
  }

  const providerStatus = `${String(order.status || "")}:${String(order.detailedStatus || "")}`;
  const expected = {
    merchantReferenceId: payment.providerMerchantReferenceId,
    amount: Number(payment.price),
  };

  const currency = String(order.currency || "").toUpperCase();
  const actualAmount = Number(order.amount);
  const verificationMismatches = [
    ...(currency !== "SAR" ? ["currency"] : []),
    ...(!Number.isFinite(actualAmount) || actualAmount.toFixed(2) !== expected.amount.toFixed(2)
      ? ["amount"]
      : []),
  ];
  if (verificationMismatches.length > 0) {
    logger.error(
      {
        paymentId: String(payment._id),
        providerOrderId: String(order.orderId || ""),
        verificationMismatches,
      },
      "Geidea order does not match the expected subscription payment",
    );
    await Subscription.updateOne(
      {
        _id: payment._id,
        paymentStatus: { $in: ["session_created", "pending"] },
        status: "pending",
      },
      {
        $set: {
          paymentStatus: "pending",
          providerStatus: `verification_mismatch:${verificationMismatches.join(",")}`,
          updatedAt: new Date(),
        },
      },
    );
    return Subscription.findById(payment._id);
  }

  if (!geideaPaymentIsSuccessful(order, expected)) {
    if (geideaProcessingDeadlinePassed(payment.createdAt)) {
      const failedByProvider = geideaPaymentIsFailed(order);
      await Subscription.updateOne(
        {
          _id: payment._id,
          paymentStatus: { $in: ["session_created", "pending"] },
          status: { $in: ["pending", "cancelled"] },
        },
        {
          $set: {
            paymentStatus: "failed",
            providerStatus: failedByProvider ? providerStatus : "timeout_unconfirmed",
            status: "cancelled",
            updatedAt: new Date(),
          },
        },
      );
    } else {
      await Subscription.updateOne(
        {
          _id: payment._id,
          paymentStatus: { $in: ["session_created", "pending"] },
          status: "pending",
        },
        { $set: { paymentStatus: "pending", providerStatus, updatedAt: new Date() } },
      );
    }
    return Subscription.findById(payment._id);
  }

  const now = new Date();
  const mongoSession = await mongoose.startSession();
  let activated: any = null;
  try {
    await mongoSession.withTransaction(async () => {
      const current = await Subscription.findOne({
        _id: payment._id,
        paymentGateway: "geidea",
        providerMerchantReferenceId: payment.providerMerchantReferenceId,
        $or: [
          { status: "pending", paymentStatus: { $in: ["session_created", "pending"] } },
          { status: "cancelled", paymentStatus: { $in: ["session_created", "pending"] } },
          { status: "cancelled", paymentStatus: "failed", providerStatus: "timeout_unconfirmed" },
        ],
      }).session(mongoSession);
      if (!current) return;

      const user = await User.findById(current.userId).session(mongoSession);
      if (!user) throw new Error("GEIDEA_SUBSCRIPTION_USER_NOT_FOUND");

      const activeSubscription = await Subscription.findOne({
        userId: { $in: ownerCandidates(current.userId) },
        status: "active",
        startDate: { $lte: now },
        endDate: { $gt: now },
      })
        .sort({ endDate: -1 })
        .session(mongoSession);
      const { startDate, endDate } = subscriptionPeriod(
        now, Number(current.durationDays) || 30, activeSubscription?.endDate,
      );
      const providerOrderId = String(order.orderId || "");

      const updated = await Subscription.findOneAndUpdate(
        {
          _id: current._id,
          paymentGateway: "geidea",
          $or: [
            { status: "pending", paymentStatus: { $in: ["session_created", "pending"] } },
            { status: "cancelled", paymentStatus: { $in: ["session_created", "pending"] } },
            { status: "cancelled", paymentStatus: "failed", providerStatus: "timeout_unconfirmed" },
          ],
        },
        {
          $set: {
            status: "active",
            paymentStatus: "paid",
            providerStatus,
            providerOrderId,
            transactionId: providerOrderId,
            paidAt: now,
            billingSnapshot: {
              name: String(user.fullName || user.username || "الطالب"),
              email: String(user.email || ""),
              phone: String(user.whatsappPhone || user.phone || ""),
            },
            startDate,
            endDate,
            approvedAt: now,
            purchaseNotificationState: "pending",
            purchaseNotificationAttempts: 0,
            updatedAt: now,
          },
        },
        { new: true, session: mongoSession },
      );
      if (!updated) return;

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            subscription: {
              type: updated.type,
              status: "active",
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          },
        },
        { session: mongoSession },
      );
      activated = {
        userId: String(user._id),
        plan: String(updated.type),
        price: Number(updated.price),
        endDate,
        invoiceNumber: subscriptionInvoiceNumber(updated),
      };
    });
  } finally {
    await mongoSession.endSession();
  }

  if (activated) {
    void deliverGeideaPurchaseNotification(String(payment._id)).catch(() => {
      logger.warn({ paymentId: String(payment._id) }, "Could not process persisted Geidea purchase notification");
    });
  }
  return Subscription.findById(payment._id);
}

/**
 * Recheck verified provider orders independently of the buyer's browser.
 * The Mongo claim prevents multiple app workers from polling the same payment at once.
 * Timeouts stay recoverable if Geidea confirms a delayed charge later.
 */
export async function reconcileOutstandingGeideaPayments() {
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const payment = await Subscription.findOneAndUpdate({
      paymentGateway: "geidea",
      providerSessionId: { $exists: true, $ne: null },
      providerMerchantReferenceId: { $exists: true, $ne: null },
      $and: [
        { $or: [
          { providerNextCheckAt: { $exists: false } },
          { providerNextCheckAt: { $lte: now } },
        ] },
        { $or: [
          { status: "pending", paymentStatus: { $in: ["session_created", "pending"] } },
          {
            status: "cancelled",
            paymentStatus: { $in: ["session_created", "pending"] },
            createdAt: { $gte: new Date(now.getTime() - GEIDEA_RECOVERY_MS) },
          },
          {
            status: "cancelled",
            paymentStatus: "failed",
            providerStatus: "timeout_unconfirmed",
            createdAt: { $gte: new Date(now.getTime() - GEIDEA_RECOVERY_MS) },
          },
        ] },
      ],
    }, {
      $set: { providerNextCheckAt: new Date(now.getTime() + 5_000) },
    }, { sort: { createdAt: 1 }, new: true }).select("_id paymentStatus");
    if (!payment) break;
    if (payment.paymentStatus === "failed") {
      await Subscription.updateOne({ _id: payment._id, paymentStatus: "failed" }, {
        $set: { providerNextCheckAt: new Date(now.getTime() + GEIDEA_LATE_RECHECK_MS) },
      });
    }
    try {
      await reconcileGeideaSubscriptionPayment(String(payment._id), { alreadyClaimed: true });
    } catch (error) {
      logger.warn({ paymentId: String(payment._id), error }, "Geidea order check deferred; payment remains unconfirmed");
    }
  }
}

/** Persist intent with activation; provider outages must not revoke paid access. */
export async function deliverGeideaPurchaseNotification(paymentId: string) {
  const now = new Date();
  const payment = await Subscription.findOneAndUpdate({
    _id: paymentId,
    paymentStatus: "paid",
    purchaseNotificationAttempts: { $lt: 5 },
    $or: [
      { purchaseNotificationState: "pending" },
      { purchaseNotificationState: "failed", purchaseNotificationAttemptedAt: { $lt: new Date(now.getTime() - 300_000) } },
      { purchaseNotificationState: "sending", purchaseNotificationAttemptedAt: { $lt: new Date(now.getTime() - 600_000) } },
    ],
  }, {
    $set: { purchaseNotificationState: "sending", purchaseNotificationAttemptedAt: now },
    $inc: { purchaseNotificationAttempts: 1 },
  }, { new: true });
  if (!payment) return;
  try {
    const result = await notifyStudentSubscriptionActivated({
      userId: String(payment.userId),
      plan: subscriptionPlanName(payment.type),
      price: Number(payment.price),
      endDate: payment.endDate,
      invoiceNumber: subscriptionInvoiceNumber(payment),
      invoiceUrl: `${getGeideaPublicAppUrl()}/payment/geidea/return?paymentId=${encodeURIComponent(paymentId)}`,
      paymentMethod: "Geidea",
      createInApp: payment.purchaseNotificationAttempts === 1,
    });
    await Subscription.updateOne({ _id: paymentId }, {
      $set: { purchaseNotificationState: result.sent ? "sent" : "skipped" },
    });
  } catch {
    await Subscription.updateOne({ _id: paymentId }, {
      $set: { purchaseNotificationState: "failed" },
    });
    logger.warn({ paymentId }, "Geidea purchase WhatsApp confirmation failed; paid access is preserved");
  }
}

export async function retryGeideaPurchaseNotifications() {
  const now = Date.now();
  const pending = await Subscription.find({
    paymentGateway: "geidea", paymentStatus: "paid",
    purchaseNotificationAttempts: { $lt: 5 },
    $or: [
      { purchaseNotificationState: "pending" },
      { purchaseNotificationState: "failed", purchaseNotificationAttemptedAt: { $lt: new Date(now - 300_000) } },
      { purchaseNotificationState: "sending", purchaseNotificationAttemptedAt: { $lt: new Date(now - 600_000) } },
    ],
  }).select("_id").limit(5).lean();
  for (const payment of pending) await deliverGeideaPurchaseNotification(String(payment._id));
}
