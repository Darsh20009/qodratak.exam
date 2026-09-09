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

export interface PreparedQuestionImage {
  processedBuffer: Buffer;
  originalBuffer: Buffer;
  format: string;
  width: number;
  height: number;
  processing: QuestionImageProcessingResult['processing'];
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

    // Replace light page backgrounds and pale watermark artwork with white.
    // Dark question text, diagrams, and answer labels remain untouched.
    const lightness = (red + green + blue) / 3;
    if (lightness >= 218 || (lightness >= 198 && spread <= 65)) {
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[alphaOffset] = 255;
      backgroundPixels++;
      continue;
    }

    // Remove a plain near-white page background while retaining dark text,
    // diagrams, and coloured answer choices.
    if (min >= 242 && spread <= 18) {
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[alphaOffset] = 255;
      backgroundPixels++;
      continue;
    }

    // Very faint, neutral overlays are typical of semi-transparent corner
    // watermarks. Replace them with white instead of leaving a grey veil.
    if (min >= 224 && spread <= 10) {
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[alphaOffset] = 255;
      watermarkPixels++;
    }
  }

  return { backgroundPixels, watermarkPixels };
}

export async function prepareQuestionImage(buffer: Buffer): Promise<PreparedQuestionImage> {
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

  try {
    const { data, info } = await source
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const cleaned = cleanLightBackground(data, info.channels);

    const processedBuffer = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    })
      .png({ compressionLevel: 9 })
      .toBuffer();

    return {
      processedBuffer,
      originalBuffer: buffer,
      format: 'png',
      width: info.width,
      height: info.height,
      processing: {
        status: 'processed',
        backgroundRemoved: cleaned.backgroundPixels > 0,
        watermarkCleanupApplied: cleaned.watermarkPixels > 0,
      },
    };
  } catch (error) {
    return {
      processedBuffer: buffer,
      originalBuffer: buffer,
      format: extensionForFormat(metadata.format),
      width,
      height,
      processing: {
        status: 'original_only',
        backgroundRemoved: false,
        watermarkCleanupApplied: false,
        note: 'تعذرت المعالجة التلقائية؛ تم الاحتفاظ بالصورة الأصلية كما هي.',
      },
    };
  }
}

export async function processQuestionImage(buffer: Buffer): Promise<QuestionImageProcessingResult> {
  await Promise.all([
    fs.mkdir(publicImagesDir, { recursive: true }),
    fs.mkdir(privateOriginalsDir, { recursive: true }),
  ]);

  const prepared = await prepareQuestionImage(buffer);
  const token = crypto.randomUUID();
  const originalFilename = `q-original-${token}.${prepared.format}`;
  const processedFilename = `q-img-${token}.${prepared.format === 'png' ? 'png' : prepared.format}`;

  await Promise.all([
    fs.writeFile(path.join(privateOriginalsDir, originalFilename), prepared.originalBuffer),
    fs.writeFile(path.join(publicImagesDir, processedFilename), prepared.processedBuffer),
  ]);

  return {
    imageUrl: `/api/uploads/question-images/${processedFilename}`,
    originalUrl: `/api/admin/question-images/original/${originalFilename}`,
    processing: prepared.processing,
  };
}

export function getPrivateQuestionImageOriginal(filename: string) {
  if (!/^q-original-[a-f0-9-]+\.(jpg|png|webp)$/i.test(filename)) return null;
  return path.join(privateOriginalsDir, filename);
}