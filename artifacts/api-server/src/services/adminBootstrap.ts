import { timingSafeEqual } from 'node:crypto';

export type AdminBootstrapReason =
  | 'available'
  | 'already_configured'
  | 'production_disabled'
  | 'preview_only'
  | 'database_unavailable'
  | 'bootstrap_secret_missing';

export function adminBootstrapReason(input: {
  nodeEnv?: string;
  replId?: string;
  hasMongoUri: boolean;
  bootstrapToken?: string;
  hasAdmin: boolean;
}): AdminBootstrapReason {
  if (input.nodeEnv === 'production') return 'production_disabled';
  if (input.nodeEnv !== 'development' || !input.replId) return 'preview_only';
  if (!input.hasMongoUri) return 'database_unavailable';
  if (input.hasAdmin) return 'already_configured';
  if (!input.bootstrapToken || Buffer.byteLength(input.bootstrapToken) < 32 || Buffer.byteLength(input.bootstrapToken) > 512) {
    return 'bootstrap_secret_missing';
  }
  return 'available';
}

export function matchesAdminBootstrapToken(expected: string | undefined, provided: string): boolean {
  if (!expected || Buffer.byteLength(expected) < 32 || Buffer.byteLength(expected) > 512 || Buffer.byteLength(provided) > 512) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const providedBuffer = Buffer.from(provided, 'utf8');
  const sameLength = expectedBuffer.length === providedBuffer.length;
  const paddedProvided = Buffer.alloc(expectedBuffer.length);
  providedBuffer.copy(paddedProvided, 0, 0, Math.min(providedBuffer.length, paddedProvided.length));
  const matches = timingSafeEqual(expectedBuffer, paddedProvided);
  return sameLength && matches;
}
