// ============================================================
//  Routes — Upload d'images
//  POST /api/upload/listing/:id   — Uploader des photos
//  DELETE /api/upload/image/:id   — Supprimer une photo
//  PUT  /api/upload/image/:id/cover — Définir comme photo principale
// ============================================================

const express = require('express');
const multer  = require('multer');
const sharp   = require('sharp');
const path    = require('path');
const fs      = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { query }      = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimit');
const {
  buildUploadPublicUrl,
  processImageVariants,
  removeImageFiles,
} = require('../services/imageService');

const router = express.Router();
router.use(authenticate);

// ── Configuration Multer (stockage en mémoire) ──────────────

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;
const MAX_IMAGES    = parseInt(process.env.MAX_IMAGES_PER_LISTING) || 8;

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_FILE_SIZE, files: MAX_IMAGES },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Format non supporté. Utilisez JPG, PNG ou WebP.'));
    }
    cb(null, true);
  },
});

// ── Utilitaires ─────────────────────────────────────────────

const chatDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (parseInt(process.env.MAX_CHAT_FILE_SIZE_MB) || 20) * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Format de document non supporté.'));
    }
    cb(null, true);
  },
});

const getUploadDir = () => {
  return path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');
};

const AUDIO_MIME_EXTENSIONS = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
};

const DOCUMENT_MIME_EXTENSIONS = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

function normalizeAudioMimeType(input) {
  return String(input || '').trim().toLowerCase().split(';')[0];
}

function parseBase64Audio(payload) {
  const raw = String(payload || '').trim();
  if (!raw) return null;

  const match = raw.match(/^data:([^;]+);base64,(.+)$/i);
  if (match) {
    return {
      mimeType: normalizeAudioMimeType(match[1]),
      base64: match[2],
    };
  }

  return {
    mimeType: null,
    base64: raw.replace(/\s+/g, ''),
  };
}

function parseBase64File(payload) {
  const raw = String(payload || '').trim();
  if (!raw) return null;

  const match = raw.match(/^data:([^;]+);base64,(.+)$/i);
  if (match) {
    return {
      mimeType: normalizeAudioMimeType(match[1]),
      base64: match[2],
    };
  }

  return {
    mimeType: null,
    base64: raw.replace(/\s+/g, ''),
  };
}

const ensureDir = async (dir) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
};

/**
 * Optimise et sauvegarde une image en deux tailles
 * Retourne { url, thumbnail_url }
 */
const processImage = async (buffer, relativeFolder) => {
  const uploadDir   = path.join(getUploadDir(), relativeFolder);
  await ensureDir(uploadDir);

  const filename    = uuidv4();
  const fullPath    = path.join(uploadDir, `${filename}.webp`);
  const thumbPath   = path.join(uploadDir, `${filename}_thumb.webp`);

  // Image principale : max 1200x900, qualité 85
  await sharp(buffer)
    .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(fullPath);

  // Miniature : 400x300, qualité 75
  await sharp(buffer)
    .resize(400, 300, { fit: 'cover' })
    .webp({ quality: 75 })
    .toFile(thumbPath);

  // URL publique (à adapter selon le provider S3/R2 en production)
  const baseUrl = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
  return {
    url:           `${baseUrl}/uploads/${relativeFolder}/${filename}.webp`,
    thumbnail_url: `${baseUrl}/uploads/${relativeFolder}/${filename}_thumb.webp`,
    local_path:    fullPath,
    thumb_path:    thumbPath,
  };
};

// ── POST /upload/listing/:id — Uploader des photos ──────────

router.post('/listing/:id', uploadLimiter, upload.array('images', MAX_IMAGES), async (req, res, next) => {
  try {
    const listingId = req.params.id;
    const userId    = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucune image reçue' });
    }

    // Vérifier que l'annonce appartient à l'utilisateur
    const listing = await query(
      'SELECT id FROM annonces WHERE id = $1 AND user_id = $2',
      [listingId, userId]
    );
    if (!listing.rows[0]) {
      return res.status(403).json({ error: 'Annonce introuvable ou accès refusé' });
    }

    // Compter les images existantes
    const countResult = await query(
      'SELECT COUNT(*) FROM annonce_images WHERE annonce_id = $1',
      [listingId]
    );
    const existingCount = parseInt(countResult.rows[0].count);

    if (existingCount + req.files.length > MAX_IMAGES) {
      return res.status(400).json({
        error: `Maximum ${MAX_IMAGES} photos par annonce. Vous en avez déjà ${existingCount}.`,
      });
    }

    // Traiter chaque image
    const savedImages = [];
    for (let i = 0; i < req.files.length; i++) {
      const file      = req.files[i];
      const processed = await processImageVariants(file.buffer, file, listingId);
      const isFirst   = existingCount === 0 && i === 0;

      const insertResult = await query(`
        INSERT INTO annonce_images (annonce_id, url, thumbnail_url, variants, sort_order, is_cover)
        VALUES ($1, '', '', $2::jsonb, $3, $4)
        RETURNING id
      `, [listingId, JSON.stringify(processed.relativePaths), existingCount + i, isFirst]);

      const imageId = insertResult.rows[0].id;
      const publicUrls = {
        original: buildUploadPublicUrl(imageId, 'original'),
        thumb_400: buildUploadPublicUrl(imageId, 'thumb_400'),
        thumb_800: buildUploadPublicUrl(imageId, 'thumb_800'),
      };
      const variants = {
        original: { path: processed.relativePaths.original, url: publicUrls.original },
        thumb_400: { path: processed.relativePaths.thumb_400, url: publicUrls.thumb_400 },
        thumb_800: { path: processed.relativePaths.thumb_800, url: publicUrls.thumb_800 },
      };

      const result = await query(`
        UPDATE annonce_images
        SET url = $1,
            thumbnail_url = $2,
            variants = $3::jsonb
        WHERE id = $4
        RETURNING id, url, thumbnail_url, variants, sort_order, is_cover
      `, [publicUrls.original, publicUrls.thumb_400, JSON.stringify(variants), imageId]);

      savedImages.push(result.rows[0]);
    }

    res.status(201).json({
      message: `${savedImages.length} photo(s) uploadée(s)`,
      data: savedImages,
    });
  } catch (err) {
    if (err.message?.includes('Format non supporté')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ── POST /upload/product — Préparer des photos produit ───────

router.post('/product', uploadLimiter, upload.array('images', MAX_IMAGES), async (req, res, next) => {
  try {
    if (!req.user?.is_pro) {
      return res.status(403).json({ error: 'Espace réservé aux comptes Pro.' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucune image reçue' });
    }

    const savedImages = [];
    for (const file of req.files) {
      const processed = await processImage(file.buffer, `products/${req.user.id}`);
      savedImages.push({
        url: processed.url,
        thumbnail_url: processed.thumbnail_url,
      });
    }

    res.status(201).json({
      message: `${savedImages.length} photo(s) importée(s)`,
      data: savedImages,
    });
  } catch (err) {
    if (err.message?.includes('Format non supporté')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ── POST /upload/chat — Uploader une image de messagerie ─────────

router.post('/chat', uploadLimiter, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image reçue' });
    }

    const processed = await processImage(req.file.buffer, `chat/${req.user.id}`);
    res.status(201).json({
      data: {
        url: processed.url,
        thumbnail_url: processed.thumbnail_url,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/chat/audio', uploadLimiter, async (req, res, next) => {
  try {
    const parsed = parseBase64Audio(req.body?.audio_base64);
    const fallbackMime = normalizeAudioMimeType(req.body?.mime_type);
    const mimeType = parsed?.mimeType || fallbackMime;

    if (!parsed?.base64) {
      return res.status(400).json({ error: 'Aucun audio reçu' });
    }

    if (!Object.prototype.hasOwnProperty.call(AUDIO_MIME_EXTENSIONS, mimeType)) {
      return res.status(400).json({ error: 'Format audio non supporté' });
    }

    const buffer = Buffer.from(parsed.base64, 'base64');
    const maxBytes = (parseInt(process.env.MAX_AUDIO_FILE_SIZE_MB) || 12) * 1024 * 1024;
    if (!buffer.length) {
      return res.status(400).json({ error: 'Audio vide' });
    }
    if (buffer.length > maxBytes) {
      return res.status(413).json({ error: 'Audio trop volumineux' });
    }

    const relativeFolder = path.join('chat', String(req.user.id));
    const uploadDir = path.join(getUploadDir(), relativeFolder);
    await ensureDir(uploadDir);

    const extension = AUDIO_MIME_EXTENSIONS[mimeType];
    const filename = uuidv4();
    const fullPath = path.join(uploadDir, `${filename}.${extension}`);
    await fs.writeFile(fullPath, buffer);

    const baseUrl = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    res.status(201).json({
      data: {
        url: `${baseUrl}/uploads/${relativeFolder}/${filename}.${extension}`,
        mime_type: mimeType,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/chat/document', uploadLimiter, chatDocumentUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun document reçu' });
    }

    const mimeType = normalizeAudioMimeType(req.file.mimetype);
    if (!Object.prototype.hasOwnProperty.call(DOCUMENT_MIME_EXTENSIONS, mimeType)) {
      return res.status(400).json({ error: 'Format de document non supporté' });
    }

    const maxBytes = (parseInt(process.env.MAX_CHAT_FILE_SIZE_MB) || 20) * 1024 * 1024;
    if (req.file.size > maxBytes) {
      return res.status(413).json({ error: 'Document trop volumineux' });
    }

    const relativeFolder = path.join('chat', String(req.user.id));
    const uploadDir = path.join(getUploadDir(), relativeFolder);
    await ensureDir(uploadDir);

    const extension = DOCUMENT_MIME_EXTENSIONS[mimeType];
    const filename = uuidv4();
    const fullPath = path.join(uploadDir, `${filename}.${extension}`);
    await fs.writeFile(fullPath, req.file.buffer);

    const baseUrl = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    res.status(201).json({
      data: {
        url: `${baseUrl}/uploads/${relativeFolder}/${filename}.${extension}`,
        filename: req.file.originalname || `${filename}.${extension}`,
        mime_type: mimeType,
        size_bytes: req.file.size,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/chat/document-base64', uploadLimiter, async (req, res, next) => {
  try {
    const parsed = parseBase64File(req.body?.document_base64);
    const fallbackMime = normalizeAudioMimeType(req.body?.mime_type);
    const mimeType = parsed?.mimeType || fallbackMime;
    const fileName = String(req.body?.file_name || '').trim();

    if (!parsed?.base64) {
      return res.status(400).json({ error: 'Aucun document reçu' });
    }

    if (!Object.prototype.hasOwnProperty.call(DOCUMENT_MIME_EXTENSIONS, mimeType)) {
      return res.status(400).json({ error: 'Format de document non supporté' });
    }

    const buffer = Buffer.from(parsed.base64, 'base64');
    const maxBytes = (parseInt(process.env.MAX_CHAT_FILE_SIZE_MB) || 20) * 1024 * 1024;
    if (!buffer.length) {
      return res.status(400).json({ error: 'Document vide' });
    }
    if (buffer.length > maxBytes) {
      return res.status(413).json({ error: 'Document trop volumineux' });
    }

    const relativeFolder = path.join('chat', String(req.user.id));
    const uploadDir = path.join(getUploadDir(), relativeFolder);
    await ensureDir(uploadDir);

    const extension = DOCUMENT_MIME_EXTENSIONS[mimeType];
    const filename = uuidv4();
    const fullPath = path.join(uploadDir, `${filename}.${extension}`);
    await fs.writeFile(fullPath, buffer);

    const baseUrl = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    res.status(201).json({
      data: {
        url: `${baseUrl}/uploads/${relativeFolder}/${filename}.${extension}`,
        filename: fileName || `${filename}.${extension}`,
        mime_type: mimeType,
        size_bytes: buffer.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── PUT /upload/image/:id/cover — Définir comme couverture ──

router.put('/image/:id/cover', async (req, res, next) => {
  try {
    const imageId = req.params.id;
    const userId  = req.user.id;

    // Vérifier que l'image appartient à une annonce de l'utilisateur
    const imgResult = await query(`
      SELECT li.id, li.annonce_id FROM annonce_images li
      JOIN annonces l ON l.id = li.annonce_id
      WHERE li.id = $1 AND l.user_id = $2
    `, [imageId, userId]);

    if (!imgResult.rows[0]) {
      return res.status(403).json({ error: 'Image introuvable ou accès refusé' });
    }

    const { annonce_id: listing_id } = imgResult.rows[0];

    // Retirer is_cover des autres, mettre sur celle-ci
    await query(
      'UPDATE annonce_images SET is_cover = FALSE WHERE annonce_id = $1',
      [listing_id]
    );
    await query(
      'UPDATE annonce_images SET is_cover = TRUE WHERE id = $1',
      [imageId]
    );

    res.json({ message: 'Photo principale mise à jour' });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /upload/image/:id — Supprimer une photo ──────────

router.delete('/image/:id', async (req, res, next) => {
  try {
    const imageId = req.params.id;
    const userId  = req.user.id;

    // Vérifier l'appartenance
    const imgResult = await query(`
      SELECT li.id, li.url, li.thumbnail_url, li.is_cover, li.annonce_id
      FROM annonce_images li
      JOIN annonces l ON l.id = li.annonce_id
      WHERE li.id = $1 AND l.user_id = $2
    `, [imageId, userId]);

    if (!imgResult.rows[0]) {
      return res.status(403).json({ error: 'Image introuvable ou accès refusé' });
    }

    const img = imgResult.rows[0];

    // Supprimer en base
    await query('DELETE FROM annonce_images WHERE id = $1', [imageId]);

    // Si c'était la couverture, promouvoir la suivante
    if (img.is_cover) {
      await query(`
        WITH next_cover AS (
          SELECT id
          FROM annonce_images
          WHERE annonce_id = $1
          ORDER BY sort_order ASC
          LIMIT 1
        )
        UPDATE annonce_images
        SET is_cover = TRUE
        WHERE id IN (SELECT id FROM next_cover)
      `, [img.annonce_id]);
    }

    // Supprimer les fichiers physiques (en background)
    removeImageFiles(img).catch(() => {});

    res.json({ message: 'Photo supprimée' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
