import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const publicImagesDir = path.join(process.cwd(), 'uploads', 'question-images');
const privateOriginalsDir = path.join(process.cwd(), 'private_uploads', 'question-image-originals');
const maxInputPixels = 40_000_000;
const supportedFormats = new Set(['jpeg', 'png', 'webp']);

export interface QuestionImageProcessingResult {
  imageUrl: string;
  originalUrl: string;
  processing: {
    status: 'processed' | 'original_only';
    backgroundRemoved: boolean;
    watermarkCleanupApplied: boolean;
    note?: string;
  };
}

function extensionForFormat(format: string) {
  return format === 'jpeg' ? 'jpg' : format;
}

function cleanLightBackground(data: Buffer, channels: number) {
  let backgroundPixels = 0;
  let watermarkPixels = 0;

  for (let offset = 0; offset < data.length; offset += channels) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const alphaOffset = offset + 3;
    const min = Math.min(red, green, blue);
    const max = Math.max(red, green, blue);
    const spread = max - min;

    // Remove a plain near-white page background while retaining dark text,
    // diagrams, and coloured answer choices.
    if (min >= 242 && spread <= 18) {
      data[alphaOffset] = 0;
      backgroundPixels++;
      continue;
    }

    // Very faint, neutral overlays are typical of semi-transparent corner
    // watermarks. Fade instead of deleting outright to avoid damaging content.
    if (min >= 224 && spread <= 10) {
      const opacity = Math.max(0, Math.min(255, (242 - min) * 14));
      data[alphaOffset] = Math.min(data[alphaOffset], opacity);
      watermarkPixels++;
    }
  }

  return { backgroundPixels, watermarkPixels };
}

export async function processQuestionImage(buffer: Buffer): Promise<QuestionImageProcessingResult> {
  await Promise.all([
    fs.mkdir(publicImagesDir, { recursive: true }),
    fs.mkdir(privateOriginalsDir, { recursive: true }),
  ]);

  const source = sharp(buffer, { limitInputPixels: maxInputPixels, animated: false }).rotate();
  const metadata = await source.metadata();
  if (!metadata.format || !supportedFormats.has(metadata.format)) {
    throw new Error('صيغة الصورة غير مدعومة. استخدم PNG أو JPG أو WebP');
  }

  const width = metadata.width || 0;
  const height = metadata.height || 0;
  if (!width || !height || width * height > maxInputPixels) {
    throw new Error('أبعاد الصورة كبيرة جدًا');
  }

  const token = crypto.randomUUID();
  const originalFilename = `q-original-${token}.${extensionForFormat(metadata.format)}`;
  const processedFilename = `q-img-${token}.png`;
  const originalPath = path.join(privateOriginalsDir, originalFilename);
  const processedPath = path.join(publicImagesDir, processedFilename);

  await fs.writeFile(originalPath, buffer);

  try {
    const { data, info } = await source
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const cleaned = cleanLightBackground(data, info.channels);

    await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    })
      .png({ compressionLevel: 9 })
      .toFile(processedPath);

    return {
      imageUrl: `/api/uploads/question-images/${processedFilename}`,
      originalUrl: `/api/admin/question-images/original/${originalFilename}`,
      processing: {
        status: 'processed',
        backgroundRemoved: cleaned.backgroundPixels > 0,
        watermarkCleanupApplied: cleaned.watermarkPixels > 0,
      },
    };
  } catch (error) {
    // The original is already private and preserved. A validated source image
    // remains usable when a rare decoder or processing error occurs.
    await fs.writeFile(processedPath, buffer);
    return {
      imageUrl: `/api/uploads/question-images/${processedFilename}`,
      originalUrl: `/api/admin/question-images/original/${originalFilename}`,
      processing: {
        status: 'original_only',
        backgroundRemoved: false,
        watermarkCleanupApplied: false,
        note: 'تعذرت المعالجة التلقائية؛ تم الاحتفاظ بالصورة الأصلية كما هي.',
      },
    };
  }
}

export function getPrivateQuestionImageOriginal(filename: string) {
  if (!/^q-original-[a-f0-9-]+\.(jpg|png|webp)$/i.test(filename)) return null;
  return path.join(privateOriginalsDir, filename);
}