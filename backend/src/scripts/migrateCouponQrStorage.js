'use strict';

const fs = require('fs').promises;
const path = require('path');
const { query, pool } = require('../config/database');
const { generateQrCodeFromUrl, saveQrCodeToStorage } = require('../services/qrCodeService');

function getUploadRoot() {
  return path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');
}

async function migrateCouponQrStorage() {
  const sourceRoot = path.join(getUploadRoot(), 'qr-tickets');
  const targetRoot = path.join(getUploadRoot(), 'qr-coupons');
  await fs.mkdir(targetRoot, { recursive: true });

  const result = await query(
    `SELECT id, code, qr_code_url FROM coupons
      WHERE qr_code_url LIKE '%/uploads/qr-tickets/%'
      ORDER BY id ASC`
  );

  let copied = 0;
  let generated = 0;
  for (const row of result.rows) {
    const parsed = new URL(row.qr_code_url, process.env.BASE_URL || 'http://localhost:3001');
    const filename = path.basename(decodeURIComponent(parsed.pathname));
    if (!filename.startsWith('coupon-') || path.basename(filename) !== filename) {
      throw new Error(`Nom de QR coupon invalide pour l'identifiant ${row.id}`);
    }

    const source = path.join(sourceRoot, filename);
    const target = path.join(targetRoot, filename);
    let nextUrl = row.qr_code_url.replace('/uploads/qr-tickets/', '/uploads/qr-coupons/');
    try {
      await fs.copyFile(source, target);
      copied += 1;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const baseUrl = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
      const qrData = await generateQrCodeFromUrl(`${baseUrl}/coupon/${encodeURIComponent(row.code)}`);
      nextUrl = await saveQrCodeToStorage(`coupon-${row.code}`, qrData, 'qr-coupons');
      generated += 1;
    }

    await query('UPDATE coupons SET qr_code_url = $2 WHERE id = $1', [row.id, nextUrl]);
  }

  return { scanned: result.rows.length, copied, generated };
}

if (require.main === module) {
  migrateCouponQrStorage()
    .then((summary) => console.log(JSON.stringify(summary)))
    .catch((error) => {
      console.error('[migrate-coupon-qr-storage]', error.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = { migrateCouponQrStorage };
