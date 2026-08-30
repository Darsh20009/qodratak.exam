import crypto from "crypto";
import type { Request } from "express";

export const MAX_REGISTERED_DEVICES = 2;

export interface RegisteredDevice {
  deviceKey: string;
  label: string;
  ipHash: string;
  userAgent: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

function signingSecret() {
  return process.env.SESSION_SECRET || "qudratak-development-session";
}

function hash(value: string) {
  return crypto.createHmac("sha256", signingSecret()).update(value).digest("hex");
}

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0])?.trim() || req.ip || "unknown";
}

function deviceLabel(userAgent: string) {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iPhone أو iPad";
  if (/Android/i.test(userAgent)) return "هاتف Android";
  if (/Macintosh/i.test(userAgent)) return "جهاز Mac";
  if (/Windows/i.test(userAgent)) return "جهاز Windows";
  if (/Linux/i.test(userAgent)) return "جهاز Linux";
  return "جهاز متصفح";
}

export function getDeviceKey(req: Request, suppliedDeviceId?: unknown) {
  const supplied = String(suppliedDeviceId || "").trim();
  const source = /^[a-zA-Z0-9_-]{16,128}$/.test(supplied)
    ? `client:${supplied}`
    : `request:${req.headers["user-agent"] || "unknown"}:${clientIp(req)}`;
  return hash(source).slice(0, 32);
}

export function registerDevice(currentDevices: unknown, req: Request, suppliedDeviceId?: unknown) {
  const devices = Array.isArray(currentDevices)
    ? currentDevices.filter((device): device is RegisteredDevice => Boolean(device?.deviceKey))
    : [];
  const deviceKey = getDeviceKey(req, suppliedDeviceId);
  const now = new Date().toISOString();
  const existing = devices.find((device) => device.deviceKey === deviceKey);

  if (existing) {
    existing.lastSeenAt = now;
    return { allowed: true, deviceKey, devices };
  }
  if (devices.length >= MAX_REGISTERED_DEVICES) {
    return { allowed: false, deviceKey, devices };
  }

  devices.push({
    deviceKey,
    label: deviceLabel(String(req.headers["user-agent"] || "")),
    ipHash: hash(clientIp(req)).slice(0, 16),
    userAgent: String(req.headers["user-agent"] || "unknown").slice(0, 180),
    firstSeenAt: now,
    lastSeenAt: now,
  });
  return { allowed: true, deviceKey, devices };
}

export function publicDevices(devices: unknown, currentDeviceKey?: string) {
  return (Array.isArray(devices) ? devices : [])
    .filter((device: any) => device?.deviceKey)
    .map((device: RegisteredDevice) => ({
      id: device.deviceKey,
      label: device.label,
      firstSeenAt: device.firstSeenAt,
      lastSeenAt: device.lastSeenAt,
      isCurrent: device.deviceKey === currentDeviceKey,
    }));
}