'use strict';

const crypto = require('crypto');
const twilio = require('twilio');
const { query } = require('../config/database');
const { getRedisClient } = require('../config/redis');
const { isConfiguredValue } = require('../config/env');
const { sendMail } = require('./emailService');

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_WINDOW_MS = 10 * 60 * 1000;
const RESEND_MAX = 3;

const fallbackOtpStore = new Map();
const fallbackResendStore = new Map();

function normalizePhoneNumber(telephone) {
  const raw = String(telephone || '').trim().replace(/\s+/g, '');
  if (!raw) return '';
  if (raw.startsWith('+')) return raw;

  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('687')) return `+${digits}`;
  return `+687${digits.replace(/^0+/, '')}`;
}

function maskPhoneNumber(telephone) {
  const normalized = normalizePhoneNumber(telephone);
  if (!normalized) return '';
  const digits = normalized.replace(/\D/g, '');
  if (digits.length <= 4) return normalized;
  const visible = digits.slice(-2);
  return `${normalized.slice(0, 4)}${'•'.repeat(Math.max(4, digits.length - 6))}${visible}`;
}

function maskEmail(email) {
  const value = String(email || '').trim();
  if (!value || !value.includes('@')) return value || '';
  const [local, domain] = value.split('@');
  if (!local) return `***@${domain}`;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local.slice(-1)}@${domain}`;
}

function generateOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function buildOtpKey(telephone) {
  return `phone:otp:${telephone}`;
}

function buildResendKey(telephone) {
  return `phone:otp:resend:${telephone}`;
}

function buildTwilioClient() {
  if (!isConfiguredValue(process.env.TWILIO_ACCOUNT_SID) || !isConfiguredValue(process.env.TWILIO_AUTH_TOKEN)) {
    return null;
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID.trim(), process.env.TWILIO_AUTH_TOKEN.trim());
}

const twilioClient = buildTwilioClient();
const VERIFY_SID = isConfiguredValue(process.env.TWILIO_VERIFY_SID) ? process.env.TWILIO_VERIFY_SID.trim() : '';

function getOtpRecordFromCache(store, key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry;
}

async function loadOtpRecord(telephone) {
  const normalized = normalizePhoneNumber(telephone);
  if (!normalized) return null;

  const client = await getRedisClient();
  if (client) {
    try {
      const raw = await client.get(buildOtpKey(normalized));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.code || !parsed?.expiresAt || Date.now() > Date.parse(parsed.expiresAt)) {
        await client.del(buildOtpKey(normalized)).catch(() => {});
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  return getOtpRecordFromCache(fallbackOtpStore, buildOtpKey(normalized));
}

async function clearOtpRecord(telephone) {
  const normalized = normalizePhoneNumber(telephone);
  if (!normalized) return;

  const client = await getRedisClient();
  if (client) {
    await client.del(buildOtpKey(normalized)).catch(() => {});
    return;
  }

  fallbackOtpStore.delete(buildOtpKey(normalized));
}

async function storeOtpRecord({ telephone, code, userId, channel, expiresAt }) {
  const normalized = normalizePhoneNumber(telephone);
  const payload = {
    code,
    userId: Number(userId || 0) || null,
    telephone: normalized,
    channel,
    expiresAt,
  };

  const client = await getRedisClient();
  if (client) {
    await client.set(buildOtpKey(normalized), JSON.stringify(payload), { PX: Math.max(1, expiresAt.getTime() - Date.now()) });
    return payload;
  }

  fallbackOtpStore.set(buildOtpKey(normalized), { ...payload, expiresAt: expiresAt.getTime() });
  return payload;
}

async function recordResendAttempt(telephone) {
  const normalized = normalizePhoneNumber(telephone);
  const key = buildResendKey(normalized);

  const client = await getRedisClient();
  if (client) {
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, Math.ceil(RESEND_WINDOW_MS / 1000));
    }

    if (count > RESEND_MAX) {
      const retryAfter = Number(await client.ttl(key));
      return {
        allowed: false,
        count,
        retryAfter: retryAfter > 0 ? retryAfter : Math.ceil(RESEND_WINDOW_MS / 1000),
      };
    }

    return { allowed: true, count, retryAfter: 0 };
  }

  const entry = getOtpRecordFromCache(fallbackResendStore, key) || { count: 0, expiresAt: Date.now() + RESEND_WINDOW_MS };
  entry.count += 1;
  entry.expiresAt = Date.now() + RESEND_WINDOW_MS;
  fallbackResendStore.set(key, entry);

  if (entry.count > RESEND_MAX) {
    return {
      allowed: false,
      count: entry.count,
      retryAfter: Math.ceil((entry.expiresAt - Date.now()) / 1000),
    };
  }

  return { allowed: true, count: entry.count, retryAfter: 0 };
}

async function updateUserPhone(userId, telephone) {
  await query(
    `UPDATE users SET telephone = $1, phone_verified = FALSE, updated_at = NOW() WHERE id = $2`,
    [telephone, userId]
  );
}

async function verifyStoredOtp({ telephone, code, userId }) {
  const record = await loadOtpRecord(telephone);
  if (!record) return null;
  if (record.userId && Number(record.userId) !== Number(userId)) return null;
  if (String(record.code) !== String(code)) return null;

  await clearOtpRecord(telephone);
  await query(
    `UPDATE users
     SET telephone = $1, phone_verified = TRUE, updated_at = NOW()
     WHERE id = $2`,
    [normalizePhoneNumber(telephone), userId]
  );

  return {
    verified: true,
    message: 'Téléphone vérifié avec succès',
    channel: record.channel || 'email',
  };
}

async function sendFallbackEmailOtp({ user, telephone, code, reason }) {
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const maskedEmail = maskEmail(user.email);
  const maskedPhone = maskPhoneNumber(telephone);
  const subject = reason === 'resend'
    ? 'Votre code de vérification Troca'
    : 'Votre code de vérification Troca';

  await sendMail({
    to: user.email,
    subject,
    html: `
      <p>Bonjour ${user.prenom || 'utilisateur'},</p>
      <p>Voici votre code de vérification Troca : <strong>${code}</strong></p>
      <p>Ce code est valable pendant <strong>10 minutes</strong>.</p>
      <p>Nous l'avons envoyé en secours par email au compte <strong>${maskedEmail}</strong> pour le numéro <strong>${maskedPhone}</strong>.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.</p>
    `,
    text: `Votre code de vérification Troca est ${code}. Il est valable 10 minutes. Email destinataire: ${maskedEmail}. Numero: ${maskedPhone}.`,
  });

  return {
    success: true,
    channel: 'email',
    masked: maskedEmail,
    expires_at: expiresAt.toISOString(),
    cooldown: 60,
    message: 'Code envoyé par email',
  };
}

async function sendSmsOtp(telephone) {
  if (!twilioClient || !VERIFY_SID) {
    const error = new Error('TWILIO_NOT_CONFIGURED');
    error.code = 'TWILIO_NOT_CONFIGURED';
    throw error;
  }

  await twilioClient.verify.v2.services(VERIFY_SID)
    .verifications.create({ to: telephone, channel: 'sms' });

  return {
    success: true,
    channel: 'sms',
    masked: maskPhoneNumber(telephone),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    cooldown: 60,
    message: 'Code SMS envoyé',
  };
}

async function sendPhoneOtp({ user, telephone, preferChannel = 'sms', reason = 'send' }) {
  const normalized = normalizePhoneNumber(telephone);
  if (!normalized) {
    const error = new Error('Numéro de téléphone invalide');
    error.status = 400;
    error.code = 'PHONE_INVALID';
    throw error;
  }

  await updateUserPhone(user.id, normalized);

  if (preferChannel === 'email') {
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await storeOtpRecord({
      telephone: normalized,
      code,
      userId: user.id,
      channel: 'email',
      expiresAt,
    });
    return sendFallbackEmailOtp({ user, telephone: normalized, code, reason: reason || 'send' });
  }

  try {
    return await sendSmsOtp(normalized);
  } catch (err) {
    console.error(`[phone] Twilio send error${err?.code ? ` (${err.code})` : ''}:`, err.message);
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await storeOtpRecord({
      telephone: normalized,
      code,
      userId: user.id,
      channel: 'email',
      expiresAt,
    });
    return sendFallbackEmailOtp({ user, telephone: normalized, code, reason: reason || 'send' });
  }
}

async function resendPhoneOtp({ user, telephone, preferChannel = 'sms' }) {
  const normalized = normalizePhoneNumber(telephone);
  const limit = await recordResendAttempt(normalized);
  if (!limit.allowed) {
    const error = new Error('Trop de demandes de renvoi. Réessayez plus tard.');
    error.status = 429;
    error.retryAfter = limit.retryAfter;
    error.code = 'OTP_RESEND_LIMIT';
    throw error;
  }

  return sendPhoneOtp({ user, telephone: normalized, preferChannel, reason: 'resend' });
}

async function verifyPhoneOtp({ user, telephone, code }) {
  const normalized = normalizePhoneNumber(telephone);
  if (!normalized) {
    const error = new Error('Numéro de téléphone invalide');
    error.status = 400;
    error.code = 'PHONE_INVALID';
    throw error;
  }

  const stored = await loadOtpRecord(normalized);
  if (stored && String(stored.code) === String(code)) {
    await clearOtpRecord(normalized);
    await query(
      `UPDATE users
       SET telephone = $1, phone_verified = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [normalized, user.id]
    );

    return {
      verified: true,
      message: 'Téléphone vérifié avec succès',
      channel: stored.channel || 'email',
    };
  }

  if (!twilioClient || !VERIFY_SID) {
    const error = new Error('Vérification téléphone non configurée');
    error.status = 503;
    error.code = 'TWILIO_NOT_CONFIGURED';
    throw error;
  }

  const check = await twilioClient.verify.v2.services(VERIFY_SID)
    .verificationChecks.create({ to: normalized, code });

  if (check.status !== 'approved') {
    const error = new Error('Code incorrect ou expiré');
    error.status = 400;
    error.code = 'OTP_INVALID';
    throw error;
  }

  await clearOtpRecord(normalized);
  await query(
    `UPDATE users
     SET telephone = $1, phone_verified = TRUE, updated_at = NOW()
     WHERE id = $2`,
    [normalized, user.id]
  );

  return {
    verified: true,
    message: 'Téléphone vérifié avec succès',
    channel: 'sms',
  };
}

module.exports = {
  OTP_TTL_MS,
  RESEND_MAX,
  RESEND_WINDOW_MS,
  buildOtpKey,
  buildResendKey,
  clearOtpRecord,
  generateOtpCode,
  maskEmail,
  maskPhoneNumber,
  normalizePhoneNumber,
  recordResendAttempt,
  resendPhoneOtp,
  sendPhoneOtp,
  sendSmsOtp,
  storeOtpRecord,
  verifyPhoneOtp,
  verifyStoredOtp,
};
