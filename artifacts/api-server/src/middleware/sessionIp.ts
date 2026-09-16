import type { NextFunction, Request, Response } from "express";

const SESSION_IP_FIELD = "clientIp";
// Mobile networks and reverse proxies can legitimately change the apparent
// client IP during one browser session. Keep the stricter binding available
// for deployments that explicitly require it, but do not make it a surprise
// logout condition for the normal web app.
const enforceIpBinding = process.env.ENFORCE_SESSION_IP === "true";

function normalizeIp(value: string | undefined | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const firstForwarded = raw.split(",")[0]?.trim() || raw;
  if (firstForwarded.startsWith("::ffff:")) {
    return firstForwarded.slice("::ffff:".length);
  }
  return firstForwarded;
}

export function getClientIp(req: Request) {
  return normalizeIp(req.ip || req.socket.remoteAddress);
}

function hasAuthenticatedSession(session: any) {
  return Boolean(
    session?.userId ||
    (session?.isAdmin && session?.adminId),
  );
}

export async function enforceSessionIp(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = req.session as any;
  if (!hasAuthenticatedSession(session)) {
    next();
    return;
  }

  const currentIp = getClientIp(req);
  if (!enforceIpBinding) {
    next();
    return;
  }

  if (!currentIp) {
    res.status(401).json({
      error: "تعذر التحقق من عنوان اتصال الجلسة",
      code: "SESSION_IP_UNAVAILABLE",
    });
    return;
  }

  const sessionIp = normalizeIp(session[SESSION_IP_FIELD]);
  if (sessionIp && sessionIp !== currentIp) {
    const sessionId = req.sessionID;
    req.session.destroy((error) => {
      if (error) {
        console.error(`[Auth] failed to destroy IP-mismatched session ${sessionId}:`, error);
      }
      res.clearCookie("qodratak.sid");
      res.clearCookie("__Host-qodratak.sid");
      res.status(401).json({
        error: "انتهت الجلسة لأن عنوان الاتصال تغيّر. سجّل الدخول مرة أخرى.",
        code: "SESSION_IP_CHANGED",
      });
    });
    return;
  }

  if (!sessionIp) {
    session[SESSION_IP_FIELD] = currentIp;
    req.session.save((error) => {
      if (error) {
        console.error("[Auth] failed to bind legacy session to client IP:", error);
        res.status(401).json({
          error: "تعذر تثبيت عنوان جلسة الدخول. سجّل الدخول مرة أخرى.",
          code: "SESSION_IP_BIND_FAILED",
        });
        return;
      }
      next();
    });
    return;
  }

  next();
}
