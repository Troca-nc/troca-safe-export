'use strict';

const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimit');
const { sendMail } = require('../services/emailService');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: (parseInt(process.env.MAX_PRO_DOCUMENT_SIZE_MB || '10', 10) || 10) * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png']);
    if (!allowed.has(file.mimetype)) {
      return cb(new Error('Format de document non supporté. Utilisez PDF, JPG ou PNG.'));
    }
    cb(null, true);
  },
});

const DOCUMENT_TYPE_LABELS = {
  rc_pro: 'RC Professionnelle',
  assurance_decennale: 'Assurance Décennale',
  certification: 'Certification',
  diplome: 'Diplôme',
  extrait_ridet: 'Extrait RIDET',
  autre: 'Autre',
};

const MIME_EXTENSIONS = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

function getUploadBaseDir() {
  return path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');
}

function getBaseUrl() {
  return (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
}

function getDocumentFilePath(fileUrl) {
  if (!fileUrl) return null;
  try {
    const url = new URL(fileUrl);
    const pathname = decodeURIComponent(url.pathname || '');
    const marker = '/uploads/';
    const index = pathname.indexOf(marker);
    if (index === -1) return null;
    const relative = pathname.slice(index + marker.length);
    const root = getUploadBaseDir();
    const resolved = path.resolve(root, relative);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return null;
    return resolved;
  } catch {
    return null;
  }
}

function normalizeDocumentType(value) {
  const type = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(DOCUMENT_TYPE_LABELS, type) ? type : 'autre';
}

function formatDocumentTypeLabel(value) {
  return DOCUMENT_TYPE_LABELS[normalizeDocumentType(value)] || 'Document';
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true }).catch(() => {});
}

router.use(authenticate);

router.get('/documents', async (req, res, next) => {
  try {
    if (!req.user?.is_pro) {
      return res.status(403).json({ error: 'Espace réservé aux comptes Pro.' });
    }

    const result = await query(
      `SELECT
         id,
         pro_id,
         document_type,
         label,
         file_url,
         file_name,
         file_size,
         status,
         rejection_reason,
         uploaded_at,
         validated_at,
         validated_by
       FROM pro_documents
       WHERE pro_id = $1
       ORDER BY uploaded_at DESC, id DESC`,
      [req.user.id]
    );

    return res.json({
      data: result.rows.map((row) => ({
        id: Number(row.id),
        pro_id: Number(row.pro_id),
        document_type: row.document_type,
        document_type_label: formatDocumentTypeLabel(row.document_type),
        label: row.label ?? null,
        download_url: `/api/pro/documents/${Number(row.id)}/download`,
        file_name: row.file_name ?? null,
        file_size: row.file_size == null ? null : Number(row.file_size),
        status: row.status,
        rejection_reason: row.rejection_reason ?? null,
        uploaded_at: row.uploaded_at,
        validated_at: row.validated_at ?? null,
        validated_by: row.validated_by == null ? null : Number(row.validated_by),
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/documents/:id/download', async (req, res, next) => {
  try {
    if (!req.user?.is_pro) {
      return res.status(403).json({ error: 'Espace réservé aux comptes Pro.' });
    }
    const documentId = Number(req.params.id);
    if (!Number.isFinite(documentId) || documentId <= 0) {
      return res.status(400).json({ error: 'Document invalide.' });
    }
    const result = await query(
      `SELECT file_url, file_name FROM pro_documents WHERE id = $1 AND pro_id = $2 LIMIT 1`,
      [documentId, req.user.id]
    );
    const doc = result.rows[0];
    const filePath = getDocumentFilePath(doc?.file_url);
    if (!doc || !filePath) return res.status(404).json({ error: 'Document introuvable.' });
    await fs.access(filePath);
    return res.download(filePath, doc.file_name || path.basename(filePath));
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Document introuvable.' });
    return next(err);
  }
});

router.post('/documents', uploadLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.user?.is_pro) {
      return res.status(403).json({ error: 'Espace réservé aux comptes Pro.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    const mimeType = String(req.file.mimetype || '').trim().toLowerCase();
    const extension = MIME_EXTENSIONS[mimeType];
    if (!extension) {
      return res.status(400).json({ error: 'Format de document non supporté. Utilisez PDF, JPG ou PNG.' });
    }

    const documentType = normalizeDocumentType(req.body?.document_type);
    const label = String(req.body?.label || '').trim() || null;
    const uploadDir = path.join(getUploadBaseDir(), 'pro-documents', String(req.user.id));
    await ensureDir(uploadDir);

    const filename = `${randomUUID()}.${extension}`;
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, req.file.buffer);

    const fileUrl = `${getBaseUrl()}/uploads/pro-documents/${encodeURIComponent(String(req.user.id))}/${filename}`;

    const result = await query(
      `INSERT INTO pro_documents
         (pro_id, document_type, label, file_url, file_name, file_size, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, uploaded_at`,
      [
        req.user.id,
        documentType,
        label,
        fileUrl,
        req.file.originalname || filename,
        req.file.size,
      ]
    );

    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const proName = [req.user.prenom, req.user.nom].filter(Boolean).join(' ').trim() || req.user.email || 'Professionnel';
      await sendMail({
        to: adminEmail,
        subject: `Nouveau justificatif déposé par ${proName}`,
        html: `
          <p>Nouveau justificatif déposé par <strong>${proName}</strong>.</p>
          <ul>
            <li><strong>Type :</strong> ${formatDocumentTypeLabel(documentType)}</li>
            <li><strong>Libellé :</strong> ${label || 'Non renseigné'}</li>
            <li><strong>Fichier :</strong> ${req.file.originalname || filename}</li>
            <li><strong>Taille :</strong> ${Math.round((req.file.size || 0) / 1024)} Ko</li>
          </ul>
          <p><a href="${getBaseUrl()}/admin/pro-documents">Ouvrir la validation admin</a></p>
        `,
      }).catch(() => {});
    }

    return res.status(201).json({
      data: {
        id: Number(result.rows[0].id),
        uploaded_at: result.rows[0].uploaded_at,
        document_type: documentType,
        document_type_label: formatDocumentTypeLabel(documentType),
        label,
        download_url: `/api/pro/documents/${Number(result.rows[0].id)}/download`,
        file_name: req.file.originalname || filename,
        file_size: req.file.size,
        status: 'pending',
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/documents/:id', async (req, res, next) => {
  try {
    if (!req.user?.is_pro) {
      return res.status(403).json({ error: 'Espace réservé aux comptes Pro.' });
    }

    const documentId = Number(req.params.id);
    if (!Number.isFinite(documentId) || documentId <= 0) {
      return res.status(400).json({ error: 'Document invalide.' });
    }

    const result = await query(
      `SELECT id, pro_id, file_url, file_name, status
       FROM pro_documents
       WHERE id = $1 AND pro_id = $2
       LIMIT 1`,
      [documentId, req.user.id]
    );

    const doc = result.rows[0];
    if (!doc) {
      return res.status(404).json({ error: 'Document introuvable.' });
    }
    if (doc.status !== 'pending') {
      return res.status(409).json({ error: 'Seuls les documents en attente peuvent être supprimés.' });
    }

    await query('DELETE FROM pro_documents WHERE id = $1', [documentId]);

    const filePath = getDocumentFilePath(doc.file_url);
    if (filePath) {
      await fs.unlink(filePath).catch(() => {});
    }

    return res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
