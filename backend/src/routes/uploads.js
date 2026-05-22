'use strict';

const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { query } = require('../config/database');
const { resolveImageLocalPath } = require('../services/imageService');

const router = express.Router();

function normalizeVariant(queryValue) {
  const raw = String(queryValue ?? 'original').trim().toLowerCase();
  if (raw === '400' || raw === 'thumb_400') return 'thumb_400';
  if (raw === '800' || raw === 'thumb_800') return 'thumb_800';
  return 'original';
}

async function trySendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') res.type('jpeg');
  else if (ext === '.png') res.type('png');
  else if (ext === '.webp') res.type('webp');
  else if (ext === '.heic') res.type('heic');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  await res.sendFile(path.resolve(filePath));
}

router.get('/:id', async (req, res, next) => {
  try {
    const imageId = Number(req.params.id);
    if (!Number.isInteger(imageId) || imageId <= 0) {
      return res.status(400).json({ error: 'Image invalide.' });
    }

    const variant = normalizeVariant(req.query.w);
    const { rows } = await query(
      `SELECT id, url, thumbnail_url, variants
       FROM annonce_images
       WHERE id = $1
       LIMIT 1`,
      [imageId]
    );

    const image = rows[0];
    if (!image) {
      return res.status(404).json({ error: 'Image introuvable.' });
    }

    // TODO: test E2E sur le rendu des variantes d'image et la bascule 400/800/original.
    let filePath = resolveImageLocalPath(image, variant);
    if (!filePath && variant !== 'original') {
      filePath = resolveImageLocalPath(image, 'original');
    }
    if (!filePath) {
      return res.status(404).json({ error: 'Fichier introuvable.' });
    }

    await fs.access(filePath);
    return trySendFile(res, filePath);
  } catch (err) {
    if (err?.code === 'ENOENT') {
      return res.status(404).json({ error: 'Fichier introuvable.' });
    }
    next(err);
  }
});

module.exports = router;
