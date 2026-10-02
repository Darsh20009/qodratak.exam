import mongoose from "mongoose";
import { Subscription, User } from "../mongodb/models";
import { logger } from "../lib/logger";
import { notifyStudentSubscriptionActivated } from "./adminWhatsAppNotifications";
import {
  fetchGeideaOrdersByMerchantReference,
  geideaPaymentIsFailed,
  geideaPaymentIsSuccessful,
} from "./geideaService";

type PaymentStatus =
  | "session_created"
  | "pending"
  | "paid"
  | "failed"
  | "refund_pending"
  | "refund_failed"
  | "refunded";

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

export function publicGeideaPaymentStatus(subscription: any) {
  return {
    paymentId: String(subscription._id),
    status: (subscription.paymentStatus || "pending") as PaymentStatus,
    plan: String(subscription.type || ""),
    amount: Number(subscription.price || 0),
    currency: String(subscription.currency || "SAR"),
    invoiceNumber: subscriptionInvoiceNumber(subscription),
    providerOrderId: subscription.providerOrderId || null,
    paidAt: subscription.paidAt ? new Date(subscription.paidAt).toISOString() : null,
  };
}

export async function reconcileGeideaSubscriptionPayment(paymentId: string): Promise<any | null> {
  const payment = await Subscription.findOne({
    _id: paymentId,
    paymentGateway: "geidea",
  });
  if (!payment) return null;

  if (
    payment.paymentStatus === "paid" ||
    payment.paymentStatus === "failed" ||
    payment.paymentStatus === "refund_pending" ||
    payment.paymentStatus === "refund_failed" ||
    payment.paymentStatus === "refunded"
  ) {
    return payment;
  }

  if (!payment.providerMerchantReferenceId) return payment;
  const orders = await fetchGeideaOrdersByMerchantReference(payment.providerMerchantReferenceId);
  const order = orders
    .filter((candidate) =>
      String(candidate?.merchantReferenceId || "") === payment.providerMerchantReferenceId
    )
    .sort((left, right) =>
      new Date(right?.updatedAt || right?.createdAt || 0).getTime() -
      new Date(left?.updatedAt || left?.createdAt || 0).getTime()
    )[0];
  if (!order) return payment;

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
    if (geideaPaymentIsFailed(order)) {
      await Subscription.updateOne(
        {
          _id: payment._id,
          paymentStatus: { $in: ["session_created", "pending"] },
          status: "pending",
        },
        {
          $set: {
            paymentStatus: "failed",
            providerStatus,
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
        paymentStatus: { $in: ["session_created", "pending"] },
        status: "pending",
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
      const startDate =
        activeSubscription?.endDate && activeSubscription.endDate > now
          ? new Date(activeSubscription.endDate)
          : now;
      const durationDays = Math.max(1, Number(current.durationDays) || 30);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);
      const providerOrderId = String(order.orderId || "");

      const updated = await Subscription.findOneAndUpdate(
        {
          _id: current._id,
          paymentStatus: { $in: ["session_created", "pending"] },
          status: "pending",
        },
        {
          $set: {
            status: "active",
            paymentStatus: "paid",
            providerStatus,
            providerOrderId,
            transactionId: providerOrderId,
            paidAt: now,
            startDate,
            endDate,
            approvedAt: now,
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
              startDate: startDate.toISOString().split("T")[0],
              endDate: endDate.toISOString().split("T")[0],
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
    void notifyStudentSubscriptionActivated({
      ...activated,
      paymentMethod: "Geidea",
    }).catch((error) => {
      logger.warn({ error, paymentId: String(payment._id) }, "Could not queue Geidea purchase confirmation");
    });
  }
  return Subscription.findById(payment._id);
}
