'use strict';

const fs = require('fs/promises');
const path = require('path');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');

const { query, withTransaction } = require('../config/database');
const { slugifyCategoryName } = require('../shared-copy/categoryTaxonomy');

const TARGET_FIELDS = {
  title: { label: 'Titre / Nom du produit', required: true },
  description: { label: 'Description', required: false },
  price_xpf: { label: 'Prix (XPF)', required: true },
  price_type: { label: 'Type de prix (fixed/from/on_quote/free)', required: false },
  category: { label: 'Catégorie', required: false },
  stock: { label: 'Stock / Quantité', required: false },
  unit: { label: 'Unité (unité/heure/m²/kg)', required: false },
  sku: { label: 'Référence / Code-barres', required: false },
  is_available: { label: 'Disponible (oui/non)', required: false },
  photo_url: { label: 'URL photo principale', required: false },
};

function getUploadRoot() {
  return path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');
}

function getImportDir() {
  return path.join(getUploadRoot(), 'imports');
}

function safeFileName(value) {
  return String(value || 'import')
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120) || 'import';
}

function normalizeHeader(value, index = 0) {
  const text = String(value ?? '').trim();
  return text || `colonne_${index + 1}`;
}

function normalizeMimeType(mimeType) {
  return String(mimeType || '').toLowerCase().split(';')[0].trim();
}

function normalizePriceType(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (['from', 'de', 'à partir de', 'a partir de'].includes(raw)) return 'from';
  if (['on_quote', 'sur devis', 'quote', 'devis'].includes(raw)) return 'on_quote';
  if (['free', 'gratuit', 'gratuite', '0', 'offert'].includes(raw)) return 'free';
  return 'fixed';
}

function parseBoolean(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return null;
  if (['1', 'true', 'yes', 'oui', 'y', 'vrai', 'available', 'disponible'].includes(raw)) return true;
  if (['0', 'false', 'no', 'non', 'n', 'faux', 'unavailable', 'indisponible'].includes(raw)) return false;
  return null;
}

function parseInteger(value) {
  const raw = String(value ?? '')
    .replace(/[^\d-]+/g, '')
    .trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePriceXpf(value) {
  const raw = String(value ?? '')
    .replace(/xpf/gi, '')
    .replace(/[^0-9-]+/g, '')
    .trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function saveImportFile(fileName, buffer) {
  const dir = getImportDir();
  await ensureDir(dir);
  const safeName = `${Date.now()}-${safeFileName(fileName)}`;
  const filePath = path.join(dir, safeName);
  await fs.writeFile(filePath, buffer);
  const baseUrl = (process.env.BASE_URL || 'https://kalico.nc').replace(/\/$/, '');
  return {
    filePath,
    fileUrl: `${baseUrl}/uploads/imports/${encodeURIComponent(safeName)}`,
  };
}

async function parseFile(filePath, mimeType) {
  const normalizedMime = normalizeMimeType(mimeType);
  const ext = path.extname(String(filePath || '')).toLowerCase();

  if (normalizedMime.includes('csv') || normalizedMime === 'text/plain' || ext === '.csv' || ext === '.txt') {
    const content = await fs.readFile(filePath, 'utf8');
    const rows = parse(content, {
      bom: true,
      columns: false,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: false,
    });
    if (!rows.length) return { headers: [], rows: [] };
    const headers = rows[0].map((header, index) => normalizeHeader(header, index));
    const dataRows = rows.slice(1).map((row) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = row[index] ?? '';
      });
      return entry;
    });
    return { headers, rows: dataRows };
  }

  if (normalizedMime.includes('sheet') || normalizedMime.includes('xlsx') || normalizedMime.includes('excel') || normalizedMime.includes('spreadsheetml') || ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { headers: [], rows: [] };
    const sheet = workbook.Sheets[sheetName];
    const values = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!values.length) return { headers: [], rows: [] };
    const headers = values[0].map((header, index) => normalizeHeader(header, index));
    const rows = values.slice(1).map((row) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = row[index] ?? '';
      });
      return entry;
    });
    return { headers, rows };
  }

  throw Object.assign(new Error('Format de fichier non supporté.'), { status: 400 });
}

async function loadProDefaults(client, proId) {
  const { rows } = await client.query(
    `SELECT id, commune_id, pro_commune, pro_category
       FROM users
      WHERE id = $1
      LIMIT 1`,
    [proId]
  );
  const user = rows[0];
  if (!user) {
    throw Object.assign(new Error('Utilisateur introuvable.'), { status: 404 });
  }

  const communeId = user.commune_id || null;
  const proCommune = String(user.pro_commune || '').trim();
  const proCategory = String(user.pro_category || '').trim();

  let fallbackCommuneId = communeId;
  if (!fallbackCommuneId && proCommune) {
    const communeMatch = await client.query(
      `SELECT id
         FROM communes
        WHERE LOWER(name) = LOWER($1)
           OR LOWER(slug) = LOWER($2)
        LIMIT 1`,
      [proCommune, slugifyCategoryName(proCommune)]
    );
    fallbackCommuneId = communeMatch.rows[0]?.id || null;
  }
  if (!fallbackCommuneId) {
    const communeFallback = await client.query(`SELECT id FROM communes ORDER BY id ASC LIMIT 1`);
    fallbackCommuneId = communeFallback.rows[0]?.id || null;
  }

  const leafCategory = await client.query(
    `SELECT c.id, c.name, c.slug
       FROM categories c
      WHERE NOT EXISTS (
        SELECT 1 FROM categories child WHERE child.parent_id = c.id
      )
      ORDER BY c.sort_order ASC, c.id ASC
      LIMIT 1`
  );

  let fallbackCategoryId = leafCategory.rows[0]?.id || null;
  if (proCategory) {
    const categoryMatch = await client.query(
      `SELECT c.id
         FROM categories c
        WHERE LOWER(c.name) = LOWER($1)
           OR LOWER(c.slug) = LOWER($2)
        ORDER BY c.id ASC
        LIMIT 1`,
      [proCategory, slugifyCategoryName(proCategory)]
    );
    fallbackCategoryId = categoryMatch.rows[0]?.id || fallbackCategoryId;
  }

  return {
    communeId: fallbackCommuneId,
    categoryId: fallbackCategoryId,
    proCategory,
    proCommune,
    user,
  };
}

async function ensureCatalogCategory(client, proId, label) {
  const name = String(label || '').trim();
  if (!name) return null;

  const slugBase = slugifyCategoryName(name) || 'categorie';
  const slugResult = await client.query(
    `SELECT slug
       FROM pro_catalog_categories
      WHERE pro_id = $1
        AND (LOWER(name) = LOWER($2) OR slug = $3)
      ORDER BY id ASC
      LIMIT 1`,
    [proId, name, slugBase]
  );

  if (slugResult.rows[0]) {
    const categoryResult = await client.query(
      `SELECT id
         FROM pro_catalog_categories
        WHERE pro_id = $1
          AND slug = $2
        LIMIT 1`,
      [proId, slugResult.rows[0].slug]
    );
    return categoryResult.rows[0]?.id || null;
  }

  const nextSlug = `${slugBase}-${Date.now().toString(36)}`;
  const inserted = await client.query(
    `INSERT INTO pro_catalog_categories (pro_id, name, slug, position)
     VALUES ($1, $2, $3, 0)
     RETURNING id`,
    [proId, name, nextSlug]
  );
  return inserted.rows[0]?.id || null;
}

function buildTargetRow(sourceRow, mapping) {
  const target = {};
  const entries = Object.entries(mapping || {});
  for (const [header, targetField] of entries) {
    if (!targetField) continue;
    const value = sourceRow?.[header];
    if (typeof value === 'undefined' || value === null) continue;
    const text = String(value).trim();
    if (!text.length) continue;
    target[targetField] = text;
  }
  return target;
}

function buildError(rowIndex, rowData, reason) {
  return {
    row: rowIndex + 2,
    data: rowData,
    reason,
  };
}

function normalizeTargetData(targetRow) {
  const result = {};

  if (Object.prototype.hasOwnProperty.call(targetRow, 'title')) {
    result.title = String(targetRow.title || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(targetRow, 'description')) {
    result.description = String(targetRow.description || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(targetRow, 'price_xpf')) {
    result.price_xpf = parsePriceXpf(targetRow.price_xpf);
  }
  if (Object.prototype.hasOwnProperty.call(targetRow, 'price_type')) {
    result.price_type = normalizePriceType(targetRow.price_type);
  }
  if (Object.prototype.hasOwnProperty.call(targetRow, 'category')) {
    result.category = String(targetRow.category || '').trim();
  }
  if (Object.prototype.hasOwnProperty.call(targetRow, 'stock')) {
    result.stock = parseInteger(targetRow.stock);
  }
  if (Object.prototype.hasOwnProperty.call(targetRow, 'unit')) {
    result.unit = String(targetRow.unit || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(targetRow, 'sku')) {
    result.sku = String(targetRow.sku || '').trim() || null;
  }
  if (Object.prototype.hasOwnProperty.call(targetRow, 'is_available')) {
    result.is_available = parseBoolean(targetRow.is_available);
  }
  if (Object.prototype.hasOwnProperty.call(targetRow, 'photo_url')) {
    result.photo_url = String(targetRow.photo_url || '').trim() || null;
  }

  return result;
}

async function processImport(jobId, rows, mapping, proId) {
  const normalizedRows = Array.isArray(rows) ? rows : [];
  const safeMapping = mapping && typeof mapping === 'object' ? mapping : {};
  const errors = [];

  return withTransaction(async (client) => {
    const jobRows = await client.query(
      `SELECT id, pro_id, status, total_rows
         FROM import_jobs
        WHERE id = $1 AND pro_id = $2
        LIMIT 1`,
      [jobId, proId]
    );
    const job = jobRows.rows[0];
    if (!job) {
      throw Object.assign(new Error('Job d’import introuvable.'), { status: 404 });
    }

    const defaults = await loadProDefaults(client, proId);

    await client.query(
      `UPDATE import_jobs
          SET status = 'processing',
              started_at = COALESCE(started_at, NOW()),
              total_rows = $2,
              processed_rows = 0,
              success_count = 0,
              update_count = 0,
              error_count = 0,
              errors = '[]'::jsonb,
              column_mapping = $3::jsonb,
              updated_at = NOW()
        WHERE id = $1 AND pro_id = $4`,
      [jobId, normalizedRows.length, JSON.stringify(safeMapping), proId]
    );

    let processedRows = 0;
    let successCount = 0;
    let updateCount = 0;

    for (let index = 0; index < normalizedRows.length; index += 1) {
      const sourceRow = normalizedRows[index] || {};
      try {
        const targetRow = buildTargetRow(sourceRow, safeMapping);
        const normalized = normalizeTargetData(targetRow);
        const title = normalized.title;
        const priceXpf = normalized.price_xpf;

        if (!title) {
          throw new Error('Titre vide');
        }
        if (priceXpf == null) {
          throw new Error('Prix manquant');
        }

        const stockQuantity = Object.prototype.hasOwnProperty.call(normalized, 'stock')
          ? normalized.stock
          : null;
        const effectiveStock = stockQuantity == null ? null : Math.max(0, stockQuantity);
        const effectiveAvailability = normalized.is_available == null
          ? (effectiveStock == null ? true : effectiveStock > 0)
          : normalized.is_available;
        const effectivePriceType = normalized.price_type || 'fixed';
        const coverImageUrl = normalized.photo_url || null;
        const unitLabel = normalized.unit || null;
        const sku = normalized.sku || null;
        const catalogCategoryId = normalized.category
          ? await ensureCatalogCategory(client, proId, normalized.category)
          : null;
        const categoryMatch = normalized.category
          ? await client.query(
            `SELECT c.id
               FROM categories c
              WHERE LOWER(c.name) = LOWER($1)
                 OR LOWER(c.slug) = LOWER($2)
              ORDER BY c.id ASC
              LIMIT 1`,
            [normalized.category, slugifyCategoryName(normalized.category)]
          )
          : null;
        const categoryId = categoryMatch?.rows?.[0]?.id || defaults.categoryId;
        const communeId = defaults.communeId;

        if (!categoryId) {
          throw new Error('Catégorie introuvable');
        }
        if (!communeId) {
          throw new Error('Commune introuvable');
        }

        const duplicateRows = sku
          ? await client.query(
            `SELECT id
               FROM products
              WHERE owner_id = $1
                AND sku = $2
              LIMIT 1`,
            [proId, sku]
          )
          : await client.query(
            `SELECT id
               FROM products
              WHERE owner_id = $1
                AND LOWER(title) = LOWER($2)
              LIMIT 1`,
            [proId, title]
          );

        const existing = duplicateRows.rows[0] || null;

        if (existing) {
          await client.query(
            `UPDATE products
                SET title = $1,
                    description = $2,
                    price_type = $3,
                    price_xpf = $4,
                    stock_quantity = $5,
                    is_available = $6,
                    sku = $7,
                    unit_label = $8,
                    cover_image_url = $9,
                    category_id = $10,
                    catalog_category_id = $11,
                    commune_id = $12,
                    updated_at = NOW()
              WHERE id = $13 AND owner_id = $14`,
            [
              title,
              normalized.description || null,
              effectivePriceType,
              priceXpf,
              effectiveStock,
              effectiveAvailability && (effectiveStock == null || effectiveStock > 0),
              sku,
              unitLabel,
              coverImageUrl,
              categoryId,
              catalogCategoryId,
              communeId,
              existing.id,
              proId,
            ]
          );
          updateCount += 1;
        } else {
          await client.query(
            `INSERT INTO products
               (owner_id, title, slug, description, price_type, price_xpf, stock_quantity,
                is_available, sku, category_id, catalog_category_id, commune_id,
                unit_label, cover_image_url, is_featured)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, FALSE)`,
            [
              proId,
              title,
              `${slugifyCategoryName(title) || 'produit'}-${Date.now().toString(36)}-${index}`,
              normalized.description || null,
              effectivePriceType,
              priceXpf,
              effectiveStock,
              effectiveAvailability && (effectiveStock == null || effectiveStock > 0),
              sku,
              categoryId,
              catalogCategoryId,
              communeId,
              unitLabel,
              coverImageUrl,
            ]
          );
          successCount += 1;
        }
      } catch (error) {
        errors.push(buildError(index, sourceRow, error.message || 'Erreur inconnue'));
      } finally {
        processedRows += 1;
        await client.query(
          `UPDATE import_jobs
              SET processed_rows = $2,
                  success_count = $3,
                  update_count = $4,
                  error_count = $5,
                  errors = $6::jsonb,
                  updated_at = NOW()
            WHERE id = $1 AND pro_id = $7`,
          [jobId, processedRows, successCount, updateCount, errors.length, JSON.stringify(errors), proId]
        );
      }
    }

    await client.query(
      `UPDATE import_jobs
          SET status = 'completed',
              completed_at = NOW(),
              processed_rows = $2,
              success_count = $3,
              update_count = $4,
              error_count = $5,
              errors = $6::jsonb,
              updated_at = NOW()
        WHERE id = $1 AND pro_id = $7`,
      [jobId, processedRows, successCount, updateCount, errors.length, JSON.stringify(errors), proId]
    );

    return {
      jobId,
      processedRows,
      successCount,
      updateCount,
      errorCount: errors.length,
      errors,
    };
  });
}

module.exports = {
  TARGET_FIELDS,
  parseFile,
  processImport,
  saveImportFile,
  getImportDir,
};
