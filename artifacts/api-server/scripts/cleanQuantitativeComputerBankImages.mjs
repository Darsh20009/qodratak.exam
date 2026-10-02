import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import mongoose from 'mongoose';
import sharp from 'sharp';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_ROOT = path.resolve(SCRIPT_DIR, '../../qodratak/public');
const IMAGE_ROOT = path.join(PUBLIC_ROOT, 'foundation/quantitative/computer-banks');
const EXPECTED_IMAGE_COUNT = 2256;
const MODE = process.argv[2] || 'process';
const SOURCE_ID_PATTERN = /^quantitative-computer-bank-(\d+)-(\d+)$/;
const CAPTION_DETECTION_EXCLUSIONS = new Set([
  // These red stems are question content, not publisher captions.
  '1-12',
  '1-38',
]);
const FORCED_CAPTION_REGIONS = new Map([
  // The three publisher lines merge into one red group in this scan; keep the
  // override bounded to the reviewed text area and still mask red pixels only.
  ['45-25', { xStart: 990, xEnd: 2250, yStart: 108, yEnd: 264 }],
]);
const QUESTION_BADGE_CORE_RADIUS = 0.78;
const QUESTION_BADGE_INK_DISTANCE = 120;

if (!['process', 'repair', 'activate', 'verify'].includes(MODE)) {
  throw new Error('Usage: node cleanQuantitativeComputerBankImages.mjs [process|repair <exam-question ...>|activate|verify]');
}
const repairImageIds = process.argv.slice(3);
if (MODE === 'repair' && repairImageIds.length === 0) {
  throw new Error('Repair mode requires one or more exam-question IDs, such as 1-12');
}
if (MODE !== 'repair' && repairImageIds.length > 0) {
  throw new Error('Image IDs are only accepted in repair mode');
}

function sourceUrlFor(image) {
  return `/foundation/quantitative/computer-banks/${image.examDir}/${image.fileName}`;
}

function derivativeUrlFor(image) {
  return `/foundation/quantitative/computer-banks/${image.examDir}/background-removed/${image.outputName}`;
}

async function listSourceImages() {
  const entries = await fs.readdir(IMAGE_ROOT, { withFileTypes: true });
  const examDirs = entries
    .filter((entry) => entry.isDirectory() && /^exam-\d+$/.test(entry.name))
    .sort((a, b) => Number(a.name.slice(5)) - Number(b.name.slice(5)));
  const images = [];

  for (const examDir of examDirs) {
    const files = await fs.readdir(path.join(IMAGE_ROOT, examDir.name), { withFileTypes: true });
    for (const file of files) {
      const match = /^question-(\d+)\.jpeg$/.exec(file.name);
      if (!file.isFile() || !match) continue;
      images.push({
        examDir: examDir.name,
        examNumber: Number(examDir.name.slice(5)),
        questionNumber: Number(match[1]),
        fileName: file.name,
        outputName: file.name.replace(/\.jpeg$/i, '.png'),
        sourcePath: path.join(IMAGE_ROOT, examDir.name, file.name),
        outputPath: path.join(IMAGE_ROOT, examDir.name, 'background-removed', file.name.replace(/\.jpeg$/i, '.png')),
      });
    }
  }

  images.sort((a, b) => a.examNumber - b.examNumber || a.questionNumber - b.questionNumber);
  const identities = new Set(images.map((image) => `${image.examNumber}-${image.questionNumber}`));
  if (images.length !== EXPECTED_IMAGE_COUNT || identities.size !== EXPECTED_IMAGE_COUNT) {
    throw new Error(`Expected ${EXPECTED_IMAGE_COUNT} unique source JPEGs; found ${images.length}`);
  }
  return images;
}

function strongestCorner(data, width, height, channels) {
  const corners = [];
  const offsets = [4, 8, 16];
  const cornerSigns = [
    [-1, -1],
    [-1, 1],
    [1, -1],
  ];
  for (const [xSign, ySign] of cornerSigns) {
    for (const inset of offsets) {
      const x = xSign < 0 ? width - 1 - inset : inset;
      const y = ySign < 0 ? height - 1 - inset : inset;
      const offset = (y * width + x) * channels;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const lightness = (r + g + b) / 3;
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      corners.push({ x, y, score: lightness - spread * 2, lightness, spread });
    }
  }
  corners.sort((a, b) => b.score - a.score);

  if (corners[0].lightness < 170 || corners[0].spread > 85) {
    throw new Error(
      `No sufficiently light corner was found for safe background flood-fill (best sample ${corners[0].x},${corners[0].y})`,
    );
  }
  return corners[0];
}

function isStrongRed(r, g, b) {
  return r > 100 && r - g > 35 && r - b > 25;
}

function isCaptionRed(r, g, b) {
  return r > 70 && r - g > 8 && r - b > 8 && g < 250 && b < 250;
}

function isQuestionBadgeDarkPixel(r, g, b) {
  return r < 120 && g > 25 && g < 175 && g - r > 4 && g - b > 0;
}

function isQuestionBadgeFillPixel(r, g, b) {
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return g > r + 5 && g > b + 10 && luminance > 120;
}

function findQuestionNumberBadge(data, width, height, channels, imagePath) {
  if (channels < 3) {
    throw new Error(`Expected RGB source pixels while locating question badge in ${imagePath}`);
  }

  const scanXStart = Math.floor(width * 0.5);
  const scanWidth = width - scanXStart;
  const scanHeight = Math.floor(height * 0.97);
  const scanSize = scanWidth * scanHeight;
  const mask = new Uint8Array(scanSize);
  const visited = new Uint8Array(scanSize);
  const queue = new Int32Array(scanSize);

  for (let y = 0; y < scanHeight; y += 1) {
    for (let x = 0; x < scanWidth; x += 1) {
      const sourceX = scanXStart + x;
      const offset = (y * width + sourceX) * channels;
      if (isQuestionBadgeDarkPixel(data[offset], data[offset + 1], data[offset + 2])) {
        mask[y * scanWidth + x] = 1;
      }
    }
  }

  const candidates = [];
  for (let start = 0; start < scanSize; start += 1) {
    if (!mask[start] || visited[start]) continue;
    let head = 0;
    let tail = 0;
    queue[tail] = start;
    tail += 1;
    visited[start] = 1;

    let minX = scanWidth;
    let maxX = -1;
    let minY = scanHeight;
    let maxY = -1;
    let componentPixels = 0;

    while (head < tail) {
      const index = queue[head];
      head += 1;
      const x = index % scanWidth;
      const y = Math.floor(index / scanWidth);
      componentPixels += 1;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nextX = x + dx;
          const nextY = y + dy;
          if (nextX < 0 || nextX >= scanWidth || nextY < 0 || nextY >= scanHeight) continue;
          const nextIndex = nextY * scanWidth + nextX;
          if (mask[nextIndex] && !visited[nextIndex]) {
            visited[nextIndex] = 1;
            queue[tail] = nextIndex;
            tail += 1;
          }
        }
      }
    }

    const xMin = scanXStart + minX;
    const xMax = scanXStart + maxX;
    const yMin = minY;
    const yMax = maxY;
    const candidateWidth = xMax - xMin + 1;
    const candidateHeight = yMax - yMin + 1;
    const aspectRatio = candidateWidth / candidateHeight;
    const density = componentPixels / (candidateWidth * candidateHeight);
    if (componentPixels > 500
      && candidateWidth > 50
      && candidateHeight > 18
      && aspectRatio >= 2.4
      && aspectRatio <= 4.8
      && xMax > width * 0.8
      && density > 0.5
      && candidateHeight < height * 0.2) {
      candidates.push({
        xMin,
        xMax,
        yMin,
        yMax,
        width: candidateWidth,
        height: candidateHeight,
        componentPixels,
      });
    }
  }

  if (candidates.length !== 1) {
    throw new Error(
      `Expected exactly one question-number badge in ${imagePath}; found ${candidates.length}`,
    );
  }
  return candidates[0];
}

function median(values) {
  if (values.length === 0) return null;
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}

function inspectQuestionNumberBadge(data, width, height, channels, badge, imagePath) {
  const radius = badge.height / 2;
  const centerX = badge.xMin + radius;
  const centerY = (badge.yMin + badge.yMax) / 2;
  const fillSamples = [[], [], []];
  const inkSamples = [[], [], []];

  const fillXMin = Math.max(0, Math.floor(centerX - radius * 0.88));
  const fillXMax = Math.min(width - 1, Math.ceil(centerX + radius * 0.88));
  const fillYMin = Math.max(0, Math.floor(centerY - radius * 0.88));
  const fillYMax = Math.min(height - 1, Math.ceil(centerY + radius * 0.88));
  for (let y = fillYMin; y <= fillYMax; y += 1) {
    for (let x = fillXMin; x <= fillXMax; x += 1) {
      const distance = Math.hypot((x - centerX) / radius, (y - centerY) / radius);
      if (distance <= 0.56 || distance >= 0.84) continue;
      const offset = (y * width + x) * channels;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      if (!isQuestionBadgeFillPixel(r, g, b)) continue;
      fillSamples[0].push(r);
      fillSamples[1].push(g);
      fillSamples[2].push(b);
    }
  }

  for (let y = Math.max(0, Math.floor(centerY - radius * 0.6));
    y <= Math.min(height - 1, Math.ceil(centerY + radius * 0.6));
    y += 1) {
    for (let x = Math.max(badge.xMin, Math.floor(centerX + radius * 0.65));
      x <= badge.xMax;
      x += 1) {
      const offset = (y * width + x) * channels;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      if (!isQuestionBadgeDarkPixel(r, g, b)) continue;
      inkSamples[0].push(r);
      inkSamples[1].push(g);
      inkSamples[2].push(b);
    }
  }

  const fillColor = fillSamples.map(median);
  const inkColor = inkSamples.map(median);
  if (fillColor.some((channel) => channel === null)
    || inkColor.some((channel) => channel === null)) {
    throw new Error(`Could not sample question badge colors in ${imagePath}`);
  }

  let maskablePixels = 0;
  const coreRadius = radius * QUESTION_BADGE_CORE_RADIUS;
  const coreRadiusSquared = coreRadius * coreRadius;
  for (let y = Math.max(0, Math.floor(centerY - coreRadius));
    y <= Math.min(height - 1, Math.ceil(centerY + coreRadius));
    y += 1) {
    for (let x = Math.max(0, Math.floor(centerX - coreRadius));
      x <= Math.min(width - 1, Math.ceil(centerX + coreRadius));
      x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy > coreRadiusSquared) continue;
      const offset = (y * width + x) * channels;
      const colorDistance = Math.hypot(
        data[offset] - inkColor[0],
        data[offset + 1] - inkColor[1],
        data[offset + 2] - inkColor[2],
      );
      if (colorDistance <= QUESTION_BADGE_INK_DISTANCE) maskablePixels += 1;
    }
  }

  if (maskablePixels < 50) {
    throw new Error(`Too few question-number pixels found in ${imagePath}: ${maskablePixels}`);
  }

  return {
    ...badge,
    centerX,
    centerY,
    radius,
    fillColor,
    inkColor,
    maskablePixels,
  };
}

function maskQuestionNumberPixels(sourcePixels, outputPixels, width, height, sourceChannels, badge) {
  let removedPixels = 0;
  const coreRadius = badge.radius * QUESTION_BADGE_CORE_RADIUS;
  const coreRadiusSquared = coreRadius * coreRadius;
  for (let y = Math.max(0, Math.floor(badge.centerY - coreRadius));
    y <= Math.min(height - 1, Math.ceil(badge.centerY + coreRadius));
    y += 1) {
    for (let x = Math.max(0, Math.floor(badge.centerX - coreRadius));
      x <= Math.min(width - 1, Math.ceil(badge.centerX + coreRadius));
      x += 1) {
      const dx = x - badge.centerX;
      const dy = y - badge.centerY;
      if (dx * dx + dy * dy > coreRadiusSquared) continue;
      const sourceOffset = (y * width + x) * sourceChannels;
      const outputOffset = (y * width + x) * 4;
      if (outputPixels[outputOffset + 3] === 0) continue;
      const colorDistance = Math.hypot(
        sourcePixels[sourceOffset] - badge.inkColor[0],
        sourcePixels[sourceOffset + 1] - badge.inkColor[1],
        sourcePixels[sourceOffset + 2] - badge.inkColor[2],
      );
      if (colorDistance > QUESTION_BADGE_INK_DISTANCE) continue;
      outputPixels[outputOffset] = badge.fillColor[0];
      outputPixels[outputOffset + 1] = badge.fillColor[1];
      outputPixels[outputOffset + 2] = badge.fillColor[2];
      removedPixels += 1;
    }
  }
  return removedPixels;
}

function findCopyrightTextGroups(data, width, height, channels) {
  const rows = [];
  const xStart = Math.floor(width * 0.15);
  const xEnd = Math.floor(width * 0.85);
  const yEnd = Math.floor(height * 0.28);

  for (let y = 0; y < yEnd; y += 1) {
    let count = 0;
    let minX = width;
    let maxX = -1;
    for (let x = xStart; x < xEnd; x += 1) {
      const offset = (y * width + x) * channels;
      if (!isStrongRed(data[offset], data[offset + 1], data[offset + 2])) continue;
      count += 1;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    if (count >= 4) rows.push({ y, count, minX, maxX });
  }

  const groups = [];
  for (const row of rows) {
    let group = groups.at(-1);
    if (!group || row.y > group.end + 3) {
      group = {
        start: row.y,
        end: row.y,
        pixels: 0,
        rows: 0,
        minX: width,
        maxX: 0,
      };
      groups.push(group);
    }
    group.end = row.y;
    group.pixels += row.count;
    group.rows += 1;
    group.minX = Math.min(group.minX, row.minX);
    group.maxX = Math.max(group.maxX, row.maxX);
  }

  for (const group of groups) {
    group.span = group.maxX - group.minX + 1;
  }

  const wideCenteredGroups = groups.filter((group) => {
    const center = (group.minX + group.maxX) / 2;
    return group.span >= width * 0.3
      && group.pixels >= 500
      && Math.abs(center - width / 2) <= width * 0.2;
  });
  let captionPair;
  for (let firstIndex = 0; firstIndex < wideCenteredGroups.length && !captionPair; firstIndex += 1) {
    const first = wideCenteredGroups[firstIndex];
    if (first.start > height * 0.22) continue;
    for (let secondIndex = firstIndex + 1; secondIndex < wideCenteredGroups.length; secondIndex += 1) {
      const second = wideCenteredGroups[secondIndex];
      const gap = second.start - first.end;
      if (gap >= 0 && gap <= height * 0.08) {
        captionPair = [first, second];
        break;
      }
    }
  }
  if (!captionPair) return [];

  const selected = [...captionPair];
  let selectedEnd = captionPair[1].end;
  for (const group of groups) {
    if (selected.includes(group)) continue;
    const gap = group.start - selectedEnd;
    const center = (group.minX + group.maxX) / 2;
    const isShortCenteredCaptionLine = gap >= 0
      && gap <= height * 0.04
      && group.pixels >= 500
      && group.span >= width * 0.08
      && Math.abs(center - width / 2) <= width * 0.2;
    if (isShortCenteredCaptionLine) {
      selected.push(group);
      selectedEnd = group.end;
    }
  }
  return selected;
}

function runImageMagick(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('magick', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ImageMagick exited with code ${code}`));
    });
  });
}

async function processImage(image, tempDir, badge, targetPath = image.outputPath) {
  const { data: sourcePixels, info: sourceInfo } = await sharp(image.sourcePath)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (sourceInfo.channels < 3) {
    throw new Error(`Expected RGB source pixels in ${image.sourcePath}`);
  }

  let seed;
  try {
    seed = strongestCorner(sourcePixels, sourceInfo.width, sourceInfo.height, sourceInfo.channels);
  } catch (error) {
    throw new Error(`${error.message} in ${image.sourcePath}`, { cause: error });
  }
  const imageKey = `${image.examNumber}-${image.questionNumber}`;
  let captionGroups = findCopyrightTextGroups(
    sourcePixels,
    sourceInfo.width,
    sourceInfo.height,
    sourceInfo.channels,
  );
  if (CAPTION_DETECTION_EXCLUSIONS.has(imageKey)) captionGroups = [];
  const forcedCaptionRegion = FORCED_CAPTION_REGIONS.get(imageKey);
  const basePath = path.join(tempDir, `${image.examNumber}-${image.questionNumber}-base.png`);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  const bookWidth = Math.round(sourceInfo.width * 0.14);
  const bookHeight = Math.round(sourceInfo.height * 0.433);
  await runImageMagick([
    image.sourcePath,
    '-alpha', 'set',
    '-fuzz', '5%',
    '-fill', 'none',
    '-draw', `color ${seed.x},${seed.y} floodfill`,
    '-region', `${bookWidth}x${bookHeight}+0+0`,
    '-channel', 'A',
    '-evaluate', 'set', '0',
    '+channel',
    '+region',
    '-strip',
    `PNG32:${basePath}`,
  ]);

  const { data: outputPixels, info: outputInfo } = await sharp(basePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (outputInfo.width !== sourceInfo.width
    || outputInfo.height !== sourceInfo.height
    || outputInfo.channels !== 4) {
    throw new Error(`Unexpected intermediate image format for ${image.sourcePath}`);
  }

  let removedCaptionPixels = 0;
  if (captionGroups.length) {
    const xPadding = Math.max(4, Math.round(sourceInfo.width * 0.01));
    for (const group of captionGroups) {
      const xStart = Math.max(0, group.minX - xPadding);
      const xEnd = Math.min(sourceInfo.width - 1, group.maxX + xPadding);
      const yStart = Math.max(0, group.start - 2);
      const yEnd = Math.min(sourceInfo.height - 1, group.end + 2);
      for (let y = yStart; y <= yEnd; y += 1) {
        for (let x = xStart; x <= xEnd; x += 1) {
          const sourceOffset = (y * sourceInfo.width + x) * sourceInfo.channels;
          const outputOffset = (y * sourceInfo.width + x) * 4;
          const r = sourcePixels[sourceOffset];
          const g = sourcePixels[sourceOffset + 1];
          const b = sourcePixels[sourceOffset + 2];
          if (!isCaptionRed(r, g, b) || outputPixels[outputOffset + 3] === 0) continue;
          outputPixels[outputOffset] = 255;
          outputPixels[outputOffset + 1] = 255;
          outputPixels[outputOffset + 2] = 255;
          outputPixels[outputOffset + 3] = 0;
          removedCaptionPixels += 1;
        }
      }
    }
  }

  if (forcedCaptionRegion) {
    for (let y = forcedCaptionRegion.yStart; y <= forcedCaptionRegion.yEnd; y += 1) {
      for (let x = forcedCaptionRegion.xStart; x <= forcedCaptionRegion.xEnd; x += 1) {
        const sourceOffset = (y * sourceInfo.width + x) * sourceInfo.channels;
        const outputOffset = (y * sourceInfo.width + x) * 4;
        if (!isCaptionRed(
          sourcePixels[sourceOffset],
          sourcePixels[sourceOffset + 1],
          sourcePixels[sourceOffset + 2],
        ) || outputPixels[outputOffset + 3] === 0) continue;
        outputPixels[outputOffset] = 255;
        outputPixels[outputOffset + 1] = 255;
        outputPixels[outputOffset + 2] = 255;
        outputPixels[outputOffset + 3] = 0;
        removedCaptionPixels += 1;
      }
    }
  }

  if ((captionGroups.length > 0 || forcedCaptionRegion) && removedCaptionPixels < 500) {
    throw new Error(`Copyright text was detected but not sufficiently masked in ${image.sourcePath}`);
  }

  const removedQuestionNumberPixels = maskQuestionNumberPixels(
    sourcePixels,
    outputPixels,
    sourceInfo.width,
    sourceInfo.height,
    sourceInfo.channels,
    badge,
  );
  if (removedQuestionNumberPixels < 50) {
    throw new Error(`Question number was not sufficiently masked in ${image.sourcePath}`);
  }

  let transparentPixels = 0;
  let opaquePixels = 0;
  for (let offset = 3; offset < outputPixels.length; offset += 4) {
    if (outputPixels[offset] === 0) transparentPixels += 1;
    else opaquePixels += 1;
  }
  const totalPixels = sourceInfo.width * sourceInfo.height;
  if (outputPixels[3] !== 0
    || transparentPixels < totalPixels * 0.03
    || opaquePixels < totalPixels * 0.03) {
    throw new Error(`Transparency/content validation failed for ${image.sourcePath}`);
  }

  if (captionGroups.length) {
    for (const group of captionGroups) {
      for (let y = group.start; y <= group.end; y += 1) {
        for (let x = group.minX; x <= group.maxX; x += 1) {
          const sourceOffset = (y * sourceInfo.width + x) * sourceInfo.channels;
          const outputOffset = (y * sourceInfo.width + x) * 4;
          if (isStrongRed(
            sourcePixels[sourceOffset],
            sourcePixels[sourceOffset + 1],
            sourcePixels[sourceOffset + 2],
          ) && outputPixels[outputOffset + 3] !== 0) {
            throw new Error(`Red copyright pixels remain in ${image.sourcePath}`);
          }
        }
      }
    }
  }

  if (forcedCaptionRegion) {
    for (let y = forcedCaptionRegion.yStart; y <= forcedCaptionRegion.yEnd; y += 1) {
      for (let x = forcedCaptionRegion.xStart; x <= forcedCaptionRegion.xEnd; x += 1) {
        const sourceOffset = (y * sourceInfo.width + x) * sourceInfo.channels;
        const outputOffset = (y * sourceInfo.width + x) * 4;
        if (isCaptionRed(
          sourcePixels[sourceOffset],
          sourcePixels[sourceOffset + 1],
          sourcePixels[sourceOffset + 2],
        ) && outputPixels[outputOffset + 3] !== 0) {
          throw new Error(`Red copyright pixels remain in forced caption region for ${image.sourcePath}`);
        }
      }
    }
  }

  await sharp(outputPixels, {
    raw: { width: sourceInfo.width, height: sourceInfo.height, channels: 4 },
  })
    .png({ palette: true, quality: 100, compressionLevel: 9 })
    .toFile(targetPath);
  const metadata = await sharp(targetPath).metadata();
  if (metadata.format !== 'png'
    || metadata.width !== sourceInfo.width
    || metadata.height !== sourceInfo.height
    || metadata.hasAlpha !== true) {
    throw new Error(`Encoded derivative validation failed for ${targetPath}`);
  }

  await fs.unlink(basePath);
  const stat = await fs.stat(targetPath);
  return {
    hasCaption: captionGroups.length > 0 || Boolean(forcedCaptionRegion),
    removedCaptionPixels,
    removedQuestionNumberPixels,
    bytes: stat.size,
  };
}

async function validateDerivative(image) {
  const [metadata, sourceMetadata] = await Promise.all([
    sharp(image.outputPath).metadata(),
    sharp(image.sourcePath).metadata(),
  ]);
  if (metadata.format !== 'png'
    || metadata.width !== sourceMetadata.width
    || metadata.height !== sourceMetadata.height
    || metadata.hasAlpha !== true) {
    throw new Error(`Missing/invalid transparent PNG derivative: ${image.outputPath}`);
  }

  const { data, info } = await sharp(image.outputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 4 || info.width !== metadata.width || info.height !== metadata.height) {
    throw new Error(`Cannot decode derivative pixels: ${image.outputPath}`);
  }

  let transparentPixels = 0;
  let opaquePixels = 0;
  for (let offset = 3; offset < data.length; offset += 4) {
    if (data[offset] === 0) transparentPixels += 1;
    else opaquePixels += 1;
  }
  const totalPixels = info.width * info.height;
  if (data[3] !== 0
    || transparentPixels < totalPixels * 0.03
    || opaquePixels < totalPixels * 0.03) {
    throw new Error(`Derivative lacks useful transparency/content: ${image.outputPath}`);
  }
  return { bytes: (await fs.stat(image.outputPath)).size, transparentPixels };
}

async function runWorkers(items, concurrency, worker, onProgress) {
  let nextIndex = 0;
  let completed = 0;
  let firstError;

  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (!firstError) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      try {
        const result = await worker(items[index]);
        completed += 1;
        onProgress?.(completed, items.length, result);
      } catch (error) {
        firstError ||= error;
      }
    }
  }));
  if (firstError) throw firstError;
}

async function preflightQuestionNumberBadges(images) {
  const badgesByKey = new Map();
  await runWorkers(images, 2, async (image) => {
    const { data, info } = await sharp(image.sourcePath)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const bbox = findQuestionNumberBadge(
      data,
      info.width,
      info.height,
      info.channels,
      image.sourcePath,
    );
    const badge = inspectQuestionNumberBadge(
      data,
      info.width,
      info.height,
      info.channels,
      bbox,
      image.sourcePath,
    );
    return {
      key: `${image.examNumber}-${image.questionNumber}`,
      badge,
    };
  }, (completed, total, result) => {
    badgesByKey.set(result.key, result.badge);
    if (completed % 250 === 0 || completed === total) {
      console.log(`Preflighted ${completed}/${total} question-number badges`);
    }
  });
  return badgesByKey;
}

async function processAll(images, mode = 'process') {
  const badgesByKey = await preflightQuestionNumberBadges(images);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'qodratak-clean-images-'));
  let stageRoot;
  let captionImages = 0;
  let removedCaptionPixels = 0;
  let removedQuestionNumberPixels = 0;
  let totalOutputBytes = 0;
  try {
    stageRoot = await fs.mkdtemp(path.join(IMAGE_ROOT, '.question-number-stage-'));
    const stagedPathFor = (image) => path.join(stageRoot, image.examDir, image.outputName);
    await runWorkers(images, 2, async (image) => {
      const badge = badgesByKey.get(`${image.examNumber}-${image.questionNumber}`);
      if (!badge) throw new Error(`Question-number preflight is missing for ${image.sourcePath}`);
      return processImage(image, tempDir, badge, stagedPathFor(image));
    }, (completed, total, result) => {
      if (result.hasCaption) captionImages += 1;
      removedCaptionPixels += result.removedCaptionPixels;
      removedQuestionNumberPixels += result.removedQuestionNumberPixels;
      totalOutputBytes += result.bytes;
      if (completed % 50 === 0 || completed === total) {
        console.log(`Processed ${completed}/${total} images into staging`);
      }
    });

    let stagedBytes = 0;
    await runWorkers(images, 2, async (image) => validateDerivative({
      ...image,
      outputPath: stagedPathFor(image),
    }), (completed, total, result) => {
      stagedBytes += result.bytes;
      if (completed % 100 === 0 || completed === total) {
        console.log(`Validated ${completed}/${total} staged derivatives`);
      }
    });

    await runWorkers(images, 2, async (image) => {
      const stagedPath = stagedPathFor(image);
      await fs.mkdir(path.dirname(image.outputPath), { recursive: true });
      await fs.rename(stagedPath, image.outputPath);
      return { bytes: (await fs.stat(image.outputPath)).size };
    }, (completed, total) => {
      if (completed % 100 === 0 || completed === total) {
        console.log(`Activated ${completed}/${total} validated derivatives`);
      }
    });

    if (stagedBytes !== totalOutputBytes) {
      throw new Error(`Staged byte count mismatch: generated ${totalOutputBytes}, validated ${stagedBytes}`);
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
    if (stageRoot) await fs.rm(stageRoot, { recursive: true, force: true });
  }

  let verifiedBytes = 0;
  await runWorkers(images, 2, async (image) => validateDerivative(image), (completed, total, result) => {
    verifiedBytes += result.bytes;
    if (completed % 100 === 0 || completed === total) {
      console.log(`Verified ${completed}/${total} derivatives`);
    }
  });

  console.log(JSON.stringify({
    mode,
    sourceImages: images.length,
    derivativesVerified: images.length,
    imagesWithDetectedRedCopyright: captionImages,
    removedCaptionPixels,
    questionNumberBadgesVerified: badgesByKey.size,
    removedQuestionNumberPixels,
    generatedBytes: totalOutputBytes,
    verifiedBytes,
  }, null, 2));
}

async function validateAllDerivatives(images) {
  let totalBytes = 0;
  await runWorkers(images, 2, async (image) => validateDerivative(image), (completed, total, result) => {
    totalBytes += result.bytes;
    if (completed % 100 === 0 || completed === total) {
      console.log(`Validated ${completed}/${total} derivatives`);
    }
  });
  return totalBytes;
}

function expectedImageId(image) {
  return `quantitative-computer-bank-${image.examNumber}-${image.questionNumber}`;
}

async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required for database verification/activation');
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  });
  return mongoose.connection.collection('questions');
}

async function loadAndValidateDatabaseRows(collection, images) {
  const docs = await collection.find({
    'source.questionId': /^quantitative-computer-bank-\d+-\d+$/,
  }).project({
    _id: 1,
    'source.questionId': 1,
    imageUrl: 1,
    imageUrls: 1,
    imageOriginalUrl: 1,
    imageOriginalUrls: 1,
  }).toArray();
  if (docs.length !== images.length) {
    throw new Error(`Expected ${images.length} matching question records; found ${docs.length}`);
  }

  const imageById = new Map(images.map((image) => [expectedImageId(image), image]));
  const docById = new Map();
  let originalActiveCount = 0;
  let derivativeActiveCount = 0;

  for (const doc of docs) {
    const id = doc.source?.questionId;
    const image = imageById.get(id);
    if (!image || docById.has(id)) {
      throw new Error(`Missing, unexpected, or duplicate source question ID: ${id}`);
    }
    docById.set(id, doc);

    const originalUrl = sourceUrlFor(image);
    const derivativeUrl = derivativeUrlFor(image);
    if (doc.imageOriginalUrl !== originalUrl
      || !Array.isArray(doc.imageOriginalUrls)
      || doc.imageOriginalUrls.length !== 1
      || doc.imageOriginalUrls[0] !== originalUrl) {
      throw new Error(`Original image fields do not match the source for ${id}`);
    }

    const activeUrls = doc.imageUrls;
    const isOriginal = doc.imageUrl === originalUrl
      && Array.isArray(activeUrls)
      && activeUrls.length === 1
      && activeUrls[0] === originalUrl;
    const isDerivative = doc.imageUrl === derivativeUrl
      && Array.isArray(activeUrls)
      && activeUrls.length === 1
      && activeUrls[0] === derivativeUrl;
    if (!isOriginal && !isDerivative) {
      throw new Error(`Active image fields are unexpected for ${id}`);
    }
    if (isOriginal) originalActiveCount += 1;
    if (isDerivative) derivativeActiveCount += 1;
  }

  if (docById.size !== images.length) {
    throw new Error('Some source images have no matching MongoDB question record');
  }
  if (originalActiveCount !== 0 && derivativeActiveCount !== 0) {
    throw new Error('Database contains a mix of original and derivative active URLs; refusing activation');
  }

  return { docs, imageById, originalActiveCount, derivativeActiveCount };
}

async function activateAll(images) {
  const collection = await connectDatabase();
  try {
    const { docs, imageById, originalActiveCount, derivativeActiveCount } =
      await loadAndValidateDatabaseRows(collection, images);
    if (derivativeActiveCount === images.length) {
      console.log(`All ${images.length} derivative URLs are already active; originals are preserved.`);
      return;
    }
    if (originalActiveCount !== images.length) {
      throw new Error('Question URLs are neither all original nor all derivative; refusing activation');
    }

    const operations = docs.map((doc) => {
      const image = imageById.get(doc.source.questionId);
      const originalUrl = sourceUrlFor(image);
      return {
        updateOne: {
          filter: {
            _id: doc._id,
            imageUrl: originalUrl,
            imageUrls: [originalUrl],
            imageOriginalUrl: originalUrl,
            imageOriginalUrls: [originalUrl],
          },
          update: {
            $set: {
              imageUrl: derivativeUrlFor(image),
              imageUrls: [derivativeUrlFor(image)],
            },
          },
        },
      };
    });

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const result = await collection.bulkWrite(operations, { session, ordered: true });
        if (result.matchedCount !== images.length || result.modifiedCount !== images.length) {
          throw new Error(
            `Expected ${images.length} matched and modified records; got ${result.matchedCount} matched, ${result.modifiedCount} modified`,
          );
        }
      });
    } finally {
      await session.endSession();
    }

    const readBack = await loadAndValidateDatabaseRows(collection, images);
    if (readBack.derivativeActiveCount !== images.length || readBack.originalActiveCount !== 0) {
      throw new Error('Post-activation database verification failed');
    }
    console.log(JSON.stringify({
      mode: 'activate',
      activatedQuestionImages: images.length,
      originalsPreserved: images.length,
      activeUrlsVerified: readBack.derivativeActiveCount,
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

async function verifyActiveDatabaseLinks(images) {
  const collection = await connectDatabase();
  try {
    const { originalActiveCount, derivativeActiveCount } =
      await loadAndValidateDatabaseRows(collection, images);
    if (derivativeActiveCount !== images.length || originalActiveCount !== 0) {
      throw new Error(`Expected ${images.length} active derivative URLs; found ${derivativeActiveCount}`);
    }
    console.log(JSON.stringify({
      mode: 'verify',
      activeDerivativeUrls: derivativeActiveCount,
      preservedOriginalRecords: images.length,
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

const images = await listSourceImages();
console.log(`Found ${images.length} source JPEGs.`);

if (MODE === 'process') {
  await processAll(images, 'process');
} else if (MODE === 'repair') {
  const imagesByKey = new Map(images.map((image) => [
    `${image.examNumber}-${image.questionNumber}`,
    image,
  ]));
  const selectedImages = [];
  const selectedKeys = new Set();
  for (const imageId of repairImageIds) {
    if (!/^\d+-\d+$/.test(imageId) || selectedKeys.has(imageId)) {
      throw new Error(`Invalid or duplicate repair image ID: ${imageId}`);
    }
    const image = imagesByKey.get(imageId);
    if (!image) throw new Error(`No source image found for repair ID: ${imageId}`);
    selectedKeys.add(imageId);
    selectedImages.push(image);
  }
  await processAll(selectedImages, 'repair');
} else {
  const verifiedBytes = await validateAllDerivatives(images);
  console.log(`All ${images.length} derivatives passed image validation (${verifiedBytes} bytes).`);
  if (MODE === 'activate') await activateAll(images);
  if (MODE === 'verify') await verifyActiveDatabaseLinks(images);
}