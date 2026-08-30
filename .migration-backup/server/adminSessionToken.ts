import crypto from 'crypto';
import type { Request } from 'express';

export interface AdminTokenIdentity {
  adminId: string;
  username: string;
  fullName?: string;
  role: string;
  permissions: string[];
  isDemo?: boolean;
}

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function isEmbeddedPreview() {
  return process.env.NODE_ENV !== 'production' &&
    Boolean(process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS);
}

function encode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function getSecret() {
  return process.env.SESSION_SECRET || 'qudratak-session-secret-2030';
}

function sign(value: string) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createAdminAccessToken(identity: AdminTokenIdentity) {
  if (!isEmbeddedPreview()) return undefined;

  const payload = encode(JSON.stringify({
    ...identity,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  }));

  return `${payload}.${sign(payload)}`;
}

export function verifyAdminAccessToken(req: Request): AdminTokenIdentity | null {
  if (!isEmbeddedPreview()) return null;

  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';
  const separator = token.lastIndexOf('.');
  if (!token || separator <= 0) return null;

  const payload = token.slice(0, separator);
  const receivedSignature = token.slice(separator + 1);
  const expectedSignature = sign(payload);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);

  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AdminTokenIdentity & { exp?: number };
    if (!parsed.adminId || !parsed.username || !parsed.role || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      adminId: parsed.adminId,
      username: parsed.username,
      fullName: parsed.fullName,
      role: parsed.role,
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : ['all'],
      isDemo: parsed.isDemo === true,
    };
  } catch {
    return null;
  }
}