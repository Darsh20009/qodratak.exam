const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;

export type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export function parseObjectIdString(value: unknown): string | null {
  return typeof value === 'string' && OBJECT_ID_RE.test(value) ? value : null;
}

export function parseBoundedText(value: unknown, maxLength: number, required = true): string | null {
  if (typeof value !== 'string' || value.length > maxLength) return null;
  if (required && value.trim().length === 0) return null;
  return value;
}

export function parsePushSubscription(value: unknown): PushSubscriptionInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const endpoint = parseBoundedText(candidate.endpoint, 2048);
  if (!endpoint || !candidate.keys || typeof candidate.keys !== 'object' || Array.isArray(candidate.keys)) {
    return null;
  }

  const keys = candidate.keys as Record<string, unknown>;
  const p256dh = parseBoundedText(keys.p256dh, 512);
  const auth = parseBoundedText(keys.auth, 512);
  if (!p256dh || !auth) return null;

  return { endpoint, keys: { p256dh, auth } };
}