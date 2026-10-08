import mongoose from "mongoose";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import { Subscription, User } from "../mongodb/models";
import { TRIAL_CONFIG } from "../services/subscriptionEngine";

const PREMIUM_TYPES = ["Pro", "Pro Life", "Pro Life Plus", "Pro Live"];
const RIYADH_DAY_MS = 24 * 60 * 60 * 1000;

function identityCandidates(userId: unknown, email: unknown) {
  const values: Array<string | number | mongoose.Types.ObjectId> = [];
  const id = String(userId || "").trim();
  if (id) {
    values.push(id);
    if (/^\d+$/.test(id)) values.push(Number(id));
    if (mongoose.Types.ObjectId.isValid(id)) {
      values.push(new mongoose.Types.ObjectId(id));
    }
  }
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (normalizedEmail) values.push(normalizedEmail);
  return [...new Set(values)];
}

function endDateFromLegacy(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = value ? new Date(String(value)) : null;
    return date && Number.isFinite(date.getTime()) ? date : null;
  }
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isFinite(date.getTime()) ? date : null;
}

async function ensureLegacyAccountTrial(
  userId: unknown,
  email: unknown,
  now: Date,
) {
  const filePath = path.resolve(process.cwd(), "attached_assets/user.json");
  let users: any[];
  try {
    users = JSON.parse(await readFile(filePath, "utf8"));
    if (!Array.isArray(users)) return null;
  } catch {
    return null;
  }
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = users.find((candidate) =>
    String(candidate.id) === String(userId) ||
    (normalizedEmail && String(candidate.email || "").trim().toLowerCase() === normalizedEmail),
  );
  if (!user || (user.role && user.role !== "student")) return null;

  const type = String(user.subscription?.type || "");
  const subscriptionEnd = endDateFromLegacy(user.subscription?.endDate);
  if (
    PREMIUM_TYPES.includes(type) &&
    subscriptionEnd &&
    subscriptionEnd.getTime() > now.getTime()
  ) {
    return {
      user,
      paid: true,
      active: true,
      endDate: subscriptionEnd,
      trialUsed: Boolean(user.trialUsed),
      trialEndDate: user.trialEndDate || null,
    };
  }
  if (PREMIUM_TYPES.includes(type)) {
    return {
      user,
      paid: false,
      active: false,
      endDate: null,
      trialUsed: true,
      trialEndDate: user.trialEndDate || null,
    };
  }

  let trialEndDate =
    endDateFromLegacy(user.trialEndDate) ||
    (type === "free_trial" || type === "trial" ? subscriptionEnd : null);
  if (!user.trialUsed && (type === "free_trial" || type === "trial") && trialEndDate) {
    user.trialUsed = true;
    user.trialStartDate ||= user.subscription?.startDate || now.toISOString();
    user.trialEndDate = trialEndDate.toISOString();
    await writeFile(filePath, JSON.stringify(users, null, 2));
  } else if (!user.trialUsed) {
    const trialStartDate = now;
    trialEndDate = new Date(
      trialStartDate.getTime() + TRIAL_CONFIG.TRIAL_DURATION_DAYS * RIYADH_DAY_MS,
    );
    user.trialUsed = true;
    user.trialStartDate = trialStartDate.toISOString();
    user.trialEndDate = trialEndDate.toISOString();
    user.subscription = {
      ...(user.subscription || {}),
      type: "free_trial",
      status: "active",
      startDate: trialStartDate.toISOString(),
      endDate: trialEndDate.toISOString(),
      trialDays: TRIAL_CONFIG.TRIAL_DURATION_DAYS,
    };
    await writeFile(filePath, JSON.stringify(users, null, 2));
  }

  const active = Boolean(trialEndDate && trialEndDate.getTime() > now.getTime());
  return {
    user,
    paid: false,
    active,
    endDate: trialEndDate,
    trialUsed: Boolean(user.trialUsed),
    trialEndDate: trialEndDate || null,
  };
}

async function getLegacySessionRole(userId: unknown, email: unknown) {
  const filePath = path.resolve(process.cwd(), "attached_assets/user.json");
  try {
    const users = JSON.parse(await readFile(filePath, "utf8"));
    if (!Array.isArray(users)) return undefined;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = users.find((candidate) =>
      String(candidate.id) === String(userId) ||
      (normalizedEmail && String(candidate.email || "").trim().toLowerCase() === normalizedEmail),
    );
    return user ? String(user.role || "student") : undefined;
  } catch {
    return undefined;
  }
}

export async function ensureStudentAccountTrial(
  userId: unknown,
  email?: unknown,
  now = new Date(),
) {
  const candidates = identityCandidates(userId, email);
  if (!candidates.length) return null;
  if (mongoose.connection.readyState !== 1) {
    return ensureLegacyAccountTrial(userId, email, now);
  }

  let user = mongoose.Types.ObjectId.isValid(String(userId || ""))
    ? await User.findById(String(userId))
    : null;
  if (!user && email) {
    user = await User.findOne({ email: String(email).trim().toLowerCase() });
  }
  if (!user) return ensureLegacyAccountTrial(userId, email, now);
  if (user.role !== "student") return null;

  const activePaidSubscription = await Subscription.findOne({
    userId: { $in: candidates },
    type: { $in: PREMIUM_TYPES },
    status: "active",
    startDate: { $lte: now },
    endDate: { $gt: now },
  } as any)
    .sort({ endDate: -1 })
    .select("type endDate")
    .lean();
  if (activePaidSubscription) {
    return {
      user,
      paid: true,
      active: true,
      endDate: activePaidSubscription.endDate,
      trialUsed: Boolean(user.trialUsed),
      trialEndDate: user.trialEndDate || null,
    };
  }

  if (PREMIUM_TYPES.includes(String(user.subscription?.type || ""))) {
    return {
      user,
      paid: false,
      active: false,
      endDate: null,
      trialUsed: true,
      trialEndDate: user.trialEndDate || null,
    };
  }

  if (!user.trialUsed) {
    const startDate = now;
    const trialEndDate = new Date(
      startDate.getTime() + TRIAL_CONFIG.TRIAL_DURATION_DAYS * RIYADH_DAY_MS,
    );
    const updated = await User.findOneAndUpdate(
      {
        _id: user._id,
        role: "student",
        trialUsed: { $ne: true },
        "subscription.type": { $nin: PREMIUM_TYPES },
      },
      {
        $set: {
          trialUsed: true,
          trialStartDate: startDate,
          trialEndDate,
          "subscription.type": "free_trial",
          "subscription.status": "active",
          "subscription.startDate": startDate.toISOString(),
          "subscription.endDate": trialEndDate.toISOString(),
          "subscription.trialDays": TRIAL_CONFIG.TRIAL_DURATION_DAYS,
        },
      },
      { new: true },
    );
    if (updated) user = updated;
    else user = await User.findById(user._id);
  }

  if (!user) return ensureLegacyAccountTrial(userId, email, now);
  const subscriptionType = String(user?.subscription?.type || "");
  const isAccountTrial =
    subscriptionType === "free_trial" || subscriptionType === "trial";
  const trialEndDate =
    user?.trialEndDate ||
    (isAccountTrial ? endDateFromLegacy(user.subscription?.endDate) : null);
  const active = Boolean(trialEndDate && trialEndDate.getTime() > now.getTime());
  return {
    user,
    paid: false,
    active,
    endDate: trialEndDate,
    trialUsed: Boolean(user?.trialUsed),
    trialEndDate: trialEndDate || null,
  };
}

export function isAllowedAfterTrial(path: string, method: string) {
  const normalizedMethod = method.toUpperCase();
  if (path === "/api/diagnostics/client-error") return true;
  if (path === "/api/auth/logout") return true;
  if (path === "/api/user" && normalizedMethod === "GET") return true;
  if (path === "/api/user/my-subscriptions" && normalizedMethod === "GET") return true;
  if (path === "/api/subscription/status" && normalizedMethod === "POST") return true;
  if (path === "/api/subscription/plan" && normalizedMethod === "GET") return true;
  if (path === "/api/subscription/start-trial" && normalizedMethod === "POST") return true;
  if (path === "/api/student/dashboard" && normalizedMethod === "GET") return true;
  if (path === "/api/student/learning-coach" && normalizedMethod === "GET") return true;
  // Reports review the already permitted daily attempt; they do not unlock
  // further bank questions. /practice remains gated by active entitlement.
  if (path === "/api/student/exam-reports" && ["GET", "POST"].includes(normalizedMethod)) return true;
  if (path === "/api/student/exam-explanation" && normalizedMethod === "POST") return true;
  if (
    path === "/api/student/daily-adaptive-test" &&
    (normalizedMethod === "GET" || normalizedMethod === "POST")
  ) return true;
  if (path.startsWith("/api/subscription/geidea/")) return true;
  if (
    normalizedMethod === "POST" &&
    (
      path === "/api/subscription/pay-with-wallet" ||
      path === "/api/subscription/subscribe-request" ||
      path === "/api/subscriptions/create" ||
      /^\/api\/subscriptions\/[^/]+\/upload-receipt$/.test(path)
    )
  ) return true;
  if (path.startsWith("/api/auth/")) return true;
  if (path === "/api/health" || path === "/api/health/live" || path === "/api/health/ready") {
    return true;
  }
  return false;
}

export async function enforceStudentTrialAccess(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const session = (request as any).session as any;
  if (!session?.userId) return next();

  try {
    let role = session.userRole;
    if (role !== "student") {
      if (mongoose.connection.readyState === 1) {
        const user = mongoose.Types.ObjectId.isValid(String(session.userId))
          ? await User.findById(String(session.userId)).select("role").lean()
          : session.userEmail
            ? await User.findOne({ email: String(session.userEmail).toLowerCase() })
                .select("role")
                .lean()
            : null;
        role = user?.role || role;
      }
      if (!role) {
        role = await getLegacySessionRole(session.userId, session.userEmail);
      }
    }
    if (role !== "student") return next();

    const access = await ensureStudentAccountTrial(
      session.userId,
      session.userEmail,
    );
    const fullPath = `${request.baseUrl}${request.path}`.split("?")[0];
    if (!access) {
      if (isAllowedAfterTrial(fullPath, request.method)) return next();
      response.status(403).json({
        error: "تعذر العثور على سجل تجربة أو اشتراك لهذا الحساب.",
        code: "STUDENT_ENTITLEMENT_NOT_FOUND",
        upgradePath: "/subscription",
      });
      return;
    }
    if (access.paid || access.active) return next();
    if (isAllowedAfterTrial(fullPath, request.method)) return next();
    response.status(402).json({
      error: "انتهت الفترة التجريبية. اشترك لمتابعة استخدام هذه الصفحة.",
      code: "TRIAL_EXPIRED",
      upgradePath: "/subscription",
    });
  } catch (error) {
    request.log.error(
      { err: error, path: request.path },
      "Failed to enforce student trial access",
    );
    response.status(503).json({
      error: "تعذر التحقق من صلاحية الحساب مؤقتًا. حاول مرة أخرى.",
      code: "ENTITLEMENT_CHECK_UNAVAILABLE",
    });
  }
}
