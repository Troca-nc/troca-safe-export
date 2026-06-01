'use strict';

const jwt = require('jsonwebtoken');

function getSecret() {
  return process.env.JWT_SECRET || null;
}

function buildAttachmentDownloadToken(userId, messageId) {
  if (!userId || !messageId) return null;
  const secret = getSecret();
  if (!secret) return null;
  return jwt.sign(
    {
      purpose: 'message_attachment',
      sub: String(userId),
      message_id: Number(messageId),
    },
    secret,
    { expiresIn: '15m' }
  );
}

function verifyAttachmentDownloadToken(token) {
  if (!token) {
    const err = new Error('Jeton manquant');
    err.status = 401;
    throw err;
  }

  const secret = getSecret();
  if (!secret) {
    const err = new Error('JWT_SECRET manquant');
    err.status = 500;
    throw err;
  }

  const payload = jwt.verify(token, secret);
  if (payload?.purpose !== 'message_attachment') {
    const err = new Error('Jeton de pièce jointe invalide');
    err.status = 401;
    throw err;
  }

  const userId = Number(payload.sub);
  const messageId = Number(payload.message_id);
  if (!userId || !messageId) {
    const err = new Error('Jeton de pièce jointe invalide');
    err.status = 401;
    throw err;
  }

  return { userId, messageId };
}

function buildAttachmentDownloadUrl(messageId, userId) {
  const token = buildAttachmentDownloadToken(userId, messageId);
  if (!token) return null;
  const base = (process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
  return `${base}/api/messages/attachments/${messageId}/download?token=${encodeURIComponent(token)}`;
}

module.exports = {
  buildAttachmentDownloadToken,
  buildAttachmentDownloadUrl,
  verifyAttachmentDownloadToken,
};
