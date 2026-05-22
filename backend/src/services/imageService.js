'use strict';

const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const IMAGE_VARIANT_SIZES = {
  thumb_400: 400,
  thumb_800: 800,
};

function normalizeVariantName(variant = 'original') {
  if (variant === '400' || variant === 400 || variant === 'thumb_400') return 'thumb_400';
  if (variant === '800' || variant === 800 || variant === 'thumb_800') return 'thumb_800';
  return 'original';
}

function getUploadRoot() {
  return path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');
}

function getBaseUrl() {
  return (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
}

function getImageExtension(mimetype) {
  switch (mimetype) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    default:
      return 'webp';
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function buildUploadPublicUrl(imageId, variant = 'original') {
  const normalized = normalizeVariantName(variant);
  const widthParam = normalized === 'thumb_400'
    ? '400'
    : normalized === 'thumb_800'
      ? '800'
      : 'original';
  return `${getBaseUrl()}/uploads/${imageId}?w=${encodeURIComponent(widthParam)}`;
}

async function processImageVariants(buffer, file, listingId) {
  const assetKey = uuidv4();
  const extension = getImageExtension(file?.mimetype);
  const relativeFolder = path.join('annonces', String(listingId), assetKey);
  const localFolder = path.join(getUploadRoot(), relativeFolder);

  await ensureDir(localFolder);

  const originalLocalPath = path.join(localFolder, `original.${extension}`);
  const thumb400LocalPath = path.join(localFolder, 'thumb_400.webp');
  const thumb800LocalPath = path.join(localFolder, 'thumb_800.webp');

  const image = sharp(buffer, { failOnError: false }).rotate();
  const metadata = await image.metadata().catch(() => ({}));

  await fs.writeFile(originalLocalPath, buffer);
  await image
    .clone()
    .resize({ width: IMAGE_VARIANT_SIZES.thumb_400, withoutEnlargement: true, fit: 'inside' })
    .webp({ quality: 78 })
    .toFile(thumb400LocalPath);

  await image
    .clone()
    .resize({ width: IMAGE_VARIANT_SIZES.thumb_800, withoutEnlargement: true, fit: 'inside' })
    .webp({ quality: 82 })
    .toFile(thumb800LocalPath);

  return {
    assetKey,
    relativeFolder,
    relativePaths: {
      original: path.relative(getUploadRoot(), originalLocalPath).replace(/\\/g, '/'),
      thumb_400: path.relative(getUploadRoot(), thumb400LocalPath).replace(/\\/g, '/'),
      thumb_800: path.relative(getUploadRoot(), thumb800LocalPath).replace(/\\/g, '/'),
    },
    localPaths: {
      original: originalLocalPath,
      thumb_400: thumb400LocalPath,
      thumb_800: thumb800LocalPath,
    },
    metadata: {
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      format: metadata.format ?? null,
      size: metadata.size ?? null,
      mimetype: file?.mimetype ?? null,
    },
  };
}

function normalizeImageVariants(row) {
  if (!row) return null;
  if (row.variants && typeof row.variants === 'object') {
    return row.variants;
  }
  try {
    return row.variants ? JSON.parse(row.variants) : null;
  } catch {
    return null;
  }
}

function resolveImageLocalPath(row, variant = 'original') {
  const normalized = normalizeVariantName(variant);
  const variants = normalizeImageVariants(row) || {};
  const variantValue = variants[normalized];
  if (typeof variantValue === 'string' && variantValue) {
    return path.isAbsolute(variantValue) ? variantValue : path.join(getUploadRoot(), variantValue);
  }
  if (variantValue && typeof variantValue === 'object') {
    const nestedPath = variantValue.path || variantValue.local_path || variantValue.file_path;
    if (typeof nestedPath === 'string' && nestedPath) {
      return path.isAbsolute(nestedPath) ? nestedPath : path.join(getUploadRoot(), nestedPath);
    }
  }

  const fallbackUrl = normalized === 'thumb_400'
    ? row.thumbnail_url || row.url
    : normalized === 'thumb_800'
      ? row.medium_url || row.thumbnail_url || row.url
      : row.url || row.thumbnail_url;

  if (!fallbackUrl) return null;

  try {
    const parsed = new URL(fallbackUrl, getBaseUrl());
    const pathname = decodeURIComponent(parsed.pathname.replace(/^\/uploads\//, ''));
    return path.join(getUploadRoot(), pathname);
  } catch {
    return null;
  }
}

async function removeImageFiles(row) {
  const paths = [
    resolveImageLocalPath(row, 'original'),
    resolveImageLocalPath(row, 'thumb_400'),
    resolveImageLocalPath(row, 'thumb_800'),
  ].filter(Boolean);

  await Promise.all(paths.map((filePath) => fs.unlink(filePath).catch(() => {})));
}

module.exports = {
  buildUploadPublicUrl,
  processImageVariants,
  removeImageFiles,
  resolveImageLocalPath,
};
