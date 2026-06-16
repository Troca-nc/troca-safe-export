'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const QRCode = require('qrcode');

function getUploadRoot() {
  return path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads');
}

function getBaseUrl() {
  return (process.env.BASE_URL || 'https://kalico.nc').replace(/\/$/, '');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function generateTicketToken() {
  return `KAL-${crypto.randomBytes(16).toString('hex')}`;
}

async function generateQrCode(token) {
  const url = `${getBaseUrl()}/scan/${encodeURIComponent(token)}`;
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#082032',
      light: '#FFFFFF',
    },
  });
}

async function saveQrCodeToStorage(token, base64Data) {
  const data = String(base64Data || '');
  const match = data.match(/^data:image\/png;base64,(.+)$/i);
  const base64 = match ? match[1] : data.replace(/\s+/g, '');
  if (!base64) {
    throw new Error('QR code vide');
  }

  const dir = path.join(getUploadRoot(), 'qr-tickets');
  await ensureDir(dir);

  const filename = `${token}.png`;
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, Buffer.from(base64, 'base64'));

  return `${getBaseUrl()}/uploads/qr-tickets/${encodeURIComponent(filename)}`;
}

module.exports = {
  generateTicketToken,
  generateQrCode,
  saveQrCodeToStorage,
};
