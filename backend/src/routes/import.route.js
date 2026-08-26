'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');

const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimit');
const { saveImportFile, parseFile, processImport, TARGET_FIELDS } = require('../services/importService');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: (Number(process.env.MAX_IMPORT_FILE_SIZE_MB || 25)) * 1024 * 1024,
    files: 1,
  },
});

const TARGET_FIELD_LABELS = {
  title: 'Titre / Nom du produit',
  description: 'Description',
  price_xpf: 'Prix (XPF)',
  price_type: 'Type de prix (fixed/from/on_quote/free)',
  category: 'Categorie',
  stock: 'Stock / Quantite',
  unit: 'Unite (unite/heure/m2/kg)',
  sku: 'Reference / Code-barres',
  is_available: 'Disponible (oui/non)',
  photo_url: 'URL photo principale',
};

function requirePro(req, res) {
  if (!req.user) {
    res.status(401).json({ error: 'Connexion requise.' });
    return false;
  }
  if (!req.user.is_pro) {
    res.status(403).json({ error: 'Espace réservé aux comptes Pro.' });
    return false;
  }
  return true;
}

function toJobResponse(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    pro_id: Number(row.pro_id),
    original_filename: row.original_filename,
    mime_type: row.mime_type,
    file_size_bytes: Number(row.file_size_bytes ?? 0),
    file_format: row.file_format,
    status: row.status,
    total_rows: Number(row.total_rows ?? 0),
    processed_rows: Number(row.processed_rows ?? 0),
    success_count: Number(row.success_count ?? 0),
    update_count: Number(row.update_count ?? 0),
    error_count: Number(row.error_count ?? 0),
    headers: Array.isArray(row.headers) ? row.headers : [],
    preview_rows: Array.isArray(row.preview_rows) ? row.preview_rows : [],
    column_mapping: row.column_mapping && typeof row.column_mapping === 'object' ? row.column_mapping : {},
    errors: Array.isArray(row.errors) ? row.errors : [],
    report: row.report && typeof row.report === 'object' ? row.report : null,
    error_message: row.error_message || null,
    started_at: row.started_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    progress: Number(row.total_rows || 0) > 0
      ? Math.min(100, Math.round((Number(row.processed_rows || 0) / Number(row.total_rows || 1)) * 100))
      : 0,
  };
}

function getTargetFields() {
  return Object.entries(TARGET_FIELDS).map(([key, meta]) => ({
    key,
    label: TARGET_FIELD_LABELS[key] || meta.label,
    required: Boolean(meta.required),
  }));
}

function buildReportPayload(job, result) {
  const summary = {
    job_id: Number(job.id),
    pro_id: Number(job.pro_id),
    total_rows: Number(result.processedRows ?? job.total_rows ?? 0),
    processed_rows: Number(result.processedRows ?? job.processed_rows ?? 0),
    success_count: Number(result.successCount ?? job.success_count ?? 0),
    update_count: Number(result.updateCount ?? job.update_count ?? 0),
    error_count: Number(result.errorCount ?? job.error_count ?? 0),
    completed_at: new Date().toISOString(),
  };

  return {
    summary,
    errors: Array.isArray(result.errors) ? result.errors : [],
    generated_at: new Date().toISOString(),
  };
}

async function loadJobOr404(jobId, proId) {
  const result = await query(
    `SELECT *
       FROM import_jobs
      WHERE id = $1 AND pro_id = $2
      LIMIT 1`,
    [jobId, proId]
  );
  return result.rows[0] || null;
}

router.use(authenticate);
router.use(uploadLimiter);

router.get('/fields', async (req, res) => {
  if (!requirePro(req, res)) return;
  res.json({ data: getTargetFields() });
});

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    const saved = await saveImportFile(req.file.originalname || 'import', req.file.buffer);
    const parsed = await parseFile(saved.filePath, req.file.mimetype);
    const headers = Array.isArray(parsed.headers) ? parsed.headers : [];
    const previewRows = Array.isArray(parsed.rows) ? parsed.rows.slice(0, 10) : [];
    const totalRows = Array.isArray(parsed.rows) ? parsed.rows.length : 0;
    const fileFormat = String(req.file.mimetype || '').toLowerCase().includes('csv')
      ? 'csv'
      : String(req.file.mimetype || '').toLowerCase().includes('sheet') || String(req.file.mimetype || '').toLowerCase().includes('excel') || String(req.file.mimetype || '').toLowerCase().includes('xlsx')
        ? 'xlsx'
        : path.extname(req.file.originalname || '').toLowerCase().replace('.', '') || 'unknown';

    const inserted = await query(
      `INSERT INTO import_jobs (
         pro_id,
         original_filename,
         stored_filename,
         file_path,
         file_url,
         mime_type,
         file_size_bytes,
         file_format,
         status,
         total_rows,
         processed_rows,
         success_count,
         update_count,
         error_count,
         headers,
         preview_rows,
         column_mapping,
         errors,
         report,
         created_at,
         updated_at
       )
       VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,'pending',$9,0,0,0,0,$10::jsonb,$11::jsonb,'{}'::jsonb,'[]'::jsonb,'{}'::jsonb,NOW(),NOW()
       )
       RETURNING *`,
      [
        req.user.id,
        req.file.originalname || 'import',
        path.basename(saved.filePath),
        saved.filePath,
        saved.fileUrl,
        req.file.mimetype || 'application/octet-stream',
        req.file.size || 0,
        fileFormat,
        totalRows,
        JSON.stringify(headers),
        JSON.stringify(previewRows),
      ]
    );

    return res.status(201).json({
      data: {
        ...toJobResponse(inserted.rows[0]),
        target_fields: getTargetFields(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:jobId/mapping', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;

    const jobId = Number(req.params.jobId);
    if (!Number.isFinite(jobId) || jobId <= 0) {
      return res.status(400).json({ error: 'Import invalide.' });
    }

    const mapping = req.body?.mapping && typeof req.body.mapping === 'object' ? req.body.mapping : {};
    const requiredFields = Object.entries(TARGET_FIELDS)
      .filter(([, meta]) => meta.required)
      .map(([field]) => field);

    const selectedTargets = new Set(
      Object.values(mapping)
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    );
    const missingRequired = requiredFields.filter((field) => !selectedTargets.has(field));
    if (missingRequired.length) {
      return res.status(400).json({
        error: `Champs requis manquants: ${missingRequired.join(', ')}`,
      });
    }

    const job = await loadJobOr404(jobId, req.user.id);
    if (!job) {
      return res.status(404).json({ error: 'Import introuvable.' });
    }
    if (!job.file_path) {
      return res.status(400).json({ error: 'Fichier source introuvable.' });
    }

    const parsed = await parseFile(job.file_path, job.mime_type);
    const result = await processImport(jobId, parsed.rows, mapping, req.user.id);
    const report = buildReportPayload(job, result);

    await query(
      `UPDATE import_jobs
          SET report = $2::jsonb,
              status = 'completed',
              completed_at = NOW(),
              updated_at = NOW()
        WHERE id = $1 AND pro_id = $3`,
      [jobId, JSON.stringify(report), req.user.id]
    );

    const refreshed = await loadJobOr404(jobId, req.user.id);
    return res.json({
      data: {
        ...toJobResponse(refreshed),
        report,
      },
    });
  } catch (err) {
    try {
      const jobId = Number(req.params.jobId);
      if (Number.isFinite(jobId) && req.user?.id) {
        await query(
          `UPDATE import_jobs
              SET status = 'failed',
                  error_message = $2,
                  updated_at = NOW()
            WHERE id = $1 AND pro_id = $3`,
          [jobId, err.message || 'Erreur inconnue', req.user.id]
        ).catch(() => {});
      }
    } catch {}
    next(err);
  }
});

router.get('/:jobId/status', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const jobId = Number(req.params.jobId);
    if (!Number.isFinite(jobId) || jobId <= 0) {
      return res.status(400).json({ error: 'Import invalide.' });
    }

    const job = await loadJobOr404(jobId, req.user.id);
    if (!job) {
      return res.status(404).json({ error: 'Import introuvable.' });
    }

    return res.json({ data: toJobResponse(job) });
  } catch (err) {
    next(err);
  }
});

router.get('/:jobId/report', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;
    const jobId = Number(req.params.jobId);
    if (!Number.isFinite(jobId) || jobId <= 0) {
      return res.status(400).json({ error: 'Import invalide.' });
    }

    const job = await loadJobOr404(jobId, req.user.id);
    if (!job) {
      return res.status(404).json({ error: 'Import introuvable.' });
    }

    const report = job.report && typeof job.report === 'object'
      ? job.report
      : buildReportPayload(job, {
        processedRows: job.processed_rows,
        successCount: job.success_count,
        updateCount: job.update_count,
        errorCount: job.error_count,
        errors: Array.isArray(job.errors) ? job.errors : [],
      });

    return res.json({ data: report });
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    if (!requirePro(req, res)) return;

    const result = await query(
      `SELECT *
         FROM import_jobs
        WHERE pro_id = $1
        ORDER BY created_at DESC
        LIMIT 10`,
      [req.user.id]
    );

    return res.json({
      data: result.rows.map(toJobResponse),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
