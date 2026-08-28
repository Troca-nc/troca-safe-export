'use strict';

const assert = require('assert');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { describe, it } = require('../helpers');
const { saveQrCodeToStorage } = require('../../services/qrCodeService');

describe('P0-F QR storage boundary', () => {
  it('ecrit uniquement les QR coupons dans leur classe publique', async () => {
    const previousRoot = process.env.STORAGE_LOCAL_PATH;
    const previousBaseUrl = process.env.BASE_URL;
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'kalico-qr-boundary-'));
    process.env.STORAGE_LOCAL_PATH = root;
    process.env.BASE_URL = 'https://security.invalid';
    try {
      const url = await saveQrCodeToStorage(
        'coupon-SECURITY',
        Buffer.from('KALICO_TEST_ONLY').toString('base64'),
        'qr-coupons'
      );
      assert.strictEqual(url, 'https://security.invalid/uploads/qr-coupons/coupon-SECURITY.png');
      assert.strictEqual(
        await fs.readFile(path.join(root, 'qr-coupons', 'coupon-SECURITY.png'), 'utf8'),
        'KALICO_TEST_ONLY'
      );
    } finally {
      if (previousRoot == null) delete process.env.STORAGE_LOCAL_PATH;
      else process.env.STORAGE_LOCAL_PATH = previousRoot;
      if (previousBaseUrl == null) delete process.env.BASE_URL;
      else process.env.BASE_URL = previousBaseUrl;
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it('refuse toute ecriture persistante de QR billet', async () => {
    await assert.rejects(
      saveQrCodeToStorage('KAL-SECURITY', Buffer.from('x').toString('base64'), 'qr-tickets'),
      /Classe de stockage QR invalide/
    );
  });
});
