import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export type StoredMedia = {
  url: string;
  publicId?: string;
  resourceType?: string;
  format?: string;
  bytes: number;
  width?: number;
  height?: number;
  originalName?: string;
  contentType?: string;
  storage: 'cloudinary' | 'local-development';
};

export class PersistentMediaStorageUnavailableError extends Error {
  constructor() {
    super('خدمة التخزين الدائم للملفات غير مهيأة. أضف إعدادات Cloudinary قبل رفع الملفات في الإنتاج.');
    this.name = 'PersistentMediaStorageUnavailableError';
  }
}

function getCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (cloudinaryUrl) {
    try {
      const parsed = new URL(cloudinaryUrl);
      if (parsed.protocol === 'cloudinary:') {
        const apiKey = decodeURIComponent(parsed.username);
        const apiSecret = decodeURIComponent(parsed.password);
        const cloudName = parsed.hostname;
        if (apiKey && apiSecret && cloudName) return { apiKey, apiSecret, cloudName };
      }
    } catch {
      // Fall through to the split environment variables.
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

export function hasPersistentMediaStorage() {
  return Boolean(getCloudinaryConfig());
}

function safeFileStem(value: string) {
  return value
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'upload';
}

function extensionFromName(name: string, contentType?: string) {
  const nameExtension = path.extname(name).replace('.', '').toLowerCase();
  if (nameExtension) return nameExtension;
  return contentType?.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
}

async function uploadToCloudinary(
  buffer: Buffer,
  options: { folder: string; originalName: string; contentType?: string },
): Promise<StoredMedia> {
  const config = getCloudinaryConfig();
  if (!config) throw new PersistentMediaStorageUnavailableError();

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = options.folder.replace(/[^a-zA-Z0-9/_-]+/g, '-').replace(/^\/+|\/+$/g, '');
  const signatureBase = `folder=${folder}&timestamp=${timestamp}${config.apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureBase).digest('hex');
  const body = new URLSearchParams({
    file: `data:${options.contentType || 'application/octet-stream'};base64,${buffer.toString('base64')}`,
    api_key: config.apiKey,
    timestamp: String(timestamp),
    folder,
    signature,
  });

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/auto/upload`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const result = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok || !result?.secure_url) {
    const message = typeof result?.error === 'object' && result.error && 'message' in result.error
      ? String((result.error as { message?: unknown }).message || '')
      : `Cloudinary upload failed (${response.status})`;
    throw new Error(message);
  }

  return {
    url: String(result.secure_url),
    publicId: typeof result.public_id === 'string' ? result.public_id : undefined,
    resourceType: typeof result.resource_type === 'string' ? result.resource_type : undefined,
    format: typeof result.format === 'string' ? result.format : extensionFromName(options.originalName, options.contentType),
    bytes: Number(result.bytes) || buffer.byteLength,
    width: Number.isFinite(Number(result.width)) ? Number(result.width) : undefined,
    height: Number.isFinite(Number(result.height)) ? Number(result.height) : undefined,
    originalName: options.originalName,
    contentType: options.contentType,
    storage: 'cloudinary',
  };
}

async function writeDevelopmentCopy(
  buffer: Buffer,
  options: {
    originalName: string;
    contentType?: string;
    legacyDirectory: string;
    legacyUrlPrefix: string;
  },
): Promise<StoredMedia> {
  if (process.env.NODE_ENV === 'production') {
    throw new PersistentMediaStorageUnavailableError();
  }

  const extension = extensionFromName(options.originalName, options.contentType);
  const filename = `${safeFileStem(options.originalName)}-${crypto.randomUUID()}.${extension}`;
  const directory = path.resolve(options.legacyDirectory);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), buffer);

  return {
    url: `${options.legacyUrlPrefix.replace(/\/+$/, '')}/${filename}`,
    format: extension,
    bytes: buffer.byteLength,
    originalName: options.originalName,
    contentType: options.contentType,
    storage: 'local-development',
  };
}

export async function storeMediaBuffer(
  buffer: Buffer,
  options: {
    folder: string;
    originalName: string;
    contentType?: string;
    legacyDirectory: string;
    legacyUrlPrefix: string;
  },
): Promise<StoredMedia> {
  if (hasPersistentMediaStorage()) {
    return uploadToCloudinary(buffer, options);
  }
  return writeDevelopmentCopy(buffer, options);
}